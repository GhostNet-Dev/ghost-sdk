import * as THREE from 'three'
import { Loader } from "@Glibs/loader/loader";
import { Ocean } from "../ocean/ocean";
import IEventController from "@Glibs/interface/ievent";
import { Wind } from "../wind/wind";
import { GrassMaker, GrassParam } from "../grassmin/grassmaker";
import { FluffyTreeType, TreeMaker, TreeParam } from "../fluffytree/treemaker";
import { SkyBoxAllTime } from "../sky/skyboxalltime";
import { FluffyTree } from "../fluffytree/fluffytree";
import { ZeldaGrass } from "../grassmin/zeldagrass";
import { GrassData, GroundData, MapEntry, MapEntryType, MapPackage, MapType, NormalData, TreeData } from "./worldmaptypes";
import CustomGround from "../ground/customground";
import Ground from "../ground/ground";
import UltimateModular, { ModularType } from "./ultimatemodular";
import { downDataTextureAndGeometry, loadDataTextureAndGeometry, saveDataTextureAndGeometry } from "./mapstore";
import { SimpleWater } from '../ocean/simplewater';
import Grid from './grid';
import { Char } from '@Glibs/types/assettypes';
import EventBoxManager from '@Glibs/interactives/eventbox/boxmgr';
import { EventBoxType } from '@Glibs/types/eventboxtypes';
import { EventTypes } from '@Glibs/types/globaltypes';
import { CustomGroundData } from '@Glibs/types/worldmaptypes';
import ProduceTerrain3 from '../ground/prodterrain3';
import FenceModular from './fencemodular';
import { IGPhysic } from '@Glibs/interface/igphysics';
import GeometryGround from '../ground/defaultgeo';


export default class WorldMap {
    tree = new TreeMaker(this.loader, this.eventCtrl, this.scene)
    grass = new GrassMaker(this.scene, this.eventCtrl)
    normalModel: NormalData[] = []
    groundData?: GroundData
    customGround?: CustomGround
    ground?: Ground
    geometryGround?: GeometryGround
    gridLine? :THREE.LineSegments
    gridMesh? :THREE.Group
    grid = new Grid()
    evntBox = new EventBoxManager()

    constructor(
        private loader: Loader,
        private scene: THREE.Scene,
        private eventCtrl: IEventController,
        private physics: IGPhysic,
        private light: THREE.DirectionalLight,
        private modular: UltimateModular,
        private fence: FenceModular,
    ) {

    }
    MakeGround({
        mapType = MapType.Free, grid = false, gridSize = 1, gridDivision = 100,
        width = 1024 * 3, height = 1024 * 3, size = 256, rows = 10, cols = 10,
        color = 0xA6C954,
    } ={}) {
        let map: THREE.Object3D | undefined = undefined
        switch(mapType) {
            case MapType.Custom: {
                const obj = new CustomGround({ width: width, height: height, planeSize: size })
                map = obj.obj
                this.customGround = obj
                break
            }
            case MapType.Geometry: {
                const obj = new GeometryGround(this.scene, this.eventCtrl)
                map = obj.meshs
                break
            }
            case MapType.Produce: {
                const obj = new ProduceTerrain3()
                map = obj.CreateTerrain()
                obj.SetupGUI()
                obj.Show()
                break
            }
            case MapType.Free: {
                const obj = new Ground({ width: width, height: height, planeSize: size })
                map = obj.obj
                this.ground = obj
                break
            }
            case MapType.Rect:
                if (grid){
                    if (this.gridLine) this.scene.remove(this.gridLine)
                    this.gridLine = this.grid.createGrid(width, gridDivision)
                    map = this.gridLine
                } 
                break
            case MapType.RectMesh:
                if (grid){
                    if (this.gridMesh) this.scene.remove(this.gridMesh)
                    this.gridMesh = this.grid.createGridMesh(width, gridDivision, color)
                    map = this.gridMesh
                } 
                break
            case MapType.Hex:
                if (grid) {
                    if (this.gridLine) this.scene.remove(this.gridLine)
                    this.gridLine = this.grid.createOptimizedHexGrid(rows, cols, gridSize)
                    console.log(this.gridLine.position)
                    map = this.gridLine
                }
                break
            case MapType.HexMesh:
                if (grid) {
                    if (this.gridMesh) this.scene.remove(this.gridMesh)
                    this.gridMesh = this.grid.createOptimizedHexGridMesh(rows, cols, gridSize, color)
                    console.log(this.gridMesh.position)
                    map = this.gridMesh
                }
                break
        }
        if(!map) throw new Error("not defined");
        this.eventCtrl.SendEventMessage(EventTypes.SetNonGlow, map)
        this.physics.addLand(map)
        this.scene.add(map)
        return map
    }
    MakeGeometryEdit(add: Function, remove: Function) {
        if (!this.geometryGround) 
            this.geometryGround = new GeometryGround(this.scene, this.eventCtrl, { debug: true })
        this.geometryGround.show(add, remove)
    }
    GeometryEditDone() {
        this.geometryGround!.hide()
        this.physics.addLand(this.geometryGround!.meshs)
    }
    MakeSky(light: THREE.DirectionalLight) {
        return new SkyBoxAllTime(light)
    }
    MakeOcean() {
        const obj =  new Ocean(this.eventCtrl, this.light)
        this.eventCtrl.SendEventMessage(EventTypes.SetNonGlow, obj.mesh)
        this.scene.add(obj.mesh)
        return obj
    }
    MakeMirrorWater() {
        const obj = new SimpleWater(this.scene)
        this.eventCtrl.SendEventMessage(EventTypes.SetNonGlow, obj.meshs)
        return obj
    }
    MakeWind() {
        return new Wind(this.eventCtrl)
    }
    MakeGrass(param: GrassParam) {
        return this.grass.Create(param)
    }
    MakeTree(param: TreeParam) {
        return this.tree.Create(param)
    }
    GetTreeInfo(type: FluffyTreeType) {
        return this.tree.GetTreeInfo(type)
    }
    async MakeFence(pos: THREE.Vector3) {
        if (pos.y < 0) pos.y = 0
        const [mesh, type] = await this.fence.Create(pos)
        const asset = this.loader.GetAssets(type)
        const simple = this.evntBox.addEventBox(EventBoxType.Physics, asset, mesh)
        this.physics.addBuilding(simple, pos, simple.Size)
        return mesh
    }
    async MakeModular(pos: THREE.Vector3, modType = ModularType.Dirty) {
        if (pos.y < 0) pos.y = 0
        const mesh = await this.modular.Create(pos, modType)
        const asset = this.loader.GetAssets(Char.UltimateModPlatformSingleCubeGrass)
        const simple = this.evntBox.addEventBox(EventBoxType.Physics, asset, mesh)
        this.physics.addBuilding(simple, pos, simple.Size)
        return mesh
    }
    async MakeModel(id: Char, pos: THREE.Vector3, type = EventBoxType.None) {
        if (pos.y < 0) pos.y = 0
        const asset = this.loader.GetAssets(id)
        const [mesh, _] = await asset.UniqModel(id.toString() + pos.x + pos.y + pos.z)
        if (type != EventBoxType.None) {
            const simple = this.evntBox.addEventBox(type, asset, mesh)
            this.physics.addBuilding(simple, pos.clone(), simple.Size)
        }
        let meshs: THREE.Group
        if(mesh instanceof THREE.Group) {
            meshs = mesh
        } else {
            meshs = new THREE.Group()
            meshs.add(mesh)
        }
        meshs.userData.model = true
        meshs.position.copy(pos)
        this.scene.add(meshs)
        return meshs
    }
    DelModel(obj: THREE.Group) {
        this.scene.remove(obj)
    }
    DelGrass(obj: ZeldaGrass) {
        this.grass.Delete(obj)
    }
    DelTree(obj:FluffyTree) {
        this.tree.Delete(obj)
    }
    DelMirrorWater(obj: SimpleWater) {
        obj.Dispose()
    }
    DelGround(obj: Ground) {
        this.scene.remove(obj.obj)
        obj.Dispose()
    }
    DelCustomGround(obj: CustomGround) {
        this.scene.remove(obj.obj)
        obj.Dispose()
    }
    DelProduceGround(obj: ProduceTerrain3) {
        this.scene.remove(obj.terrain!)
        obj.Dispose()
    }
    DelGrid(obj: THREE.Object3D) {
        this.scene.remove(obj)
    }
    DeleteObj(obj: THREE.Object3D) {
        let cur = obj
        while(cur.parent) {
            if (cur.userData.isRoot == true) {
                if("grass" in cur.userData) {
                    this.DelGrass(cur.userData.grass)
                } else if ("tree" in cur.userData) {
                    this.DelTree(cur.userData.tree)
                } else if ("simpleWater" in cur.userData) {
                    this.DelMirrorWater(cur.userData.simpleWater)
                } else if ("produce" in cur.userData) {
                    this.DelProduceGround(cur.userData.produce)
                } else if ("ground" in cur.userData) {
                    this.DelGround(cur.userData.ground)
                } else if ("customground" in cur.userData) {
                    this.DelCustomGround(cur.userData.customground)
                } else if ("gridMesh" in cur.userData) {
                    this.DelGrid(cur.userData.gridMesh)
                } else if ("gridHexMesh" in cur.userData) {
                    this.DelGrid(cur.userData.gridHexMesh)
                } else if ("model" in cur.userData) {
                    this.DelModel(cur as THREE.Group)
                }
            }
            cur = cur.parent
        }
    }
    getPosition(id: number) {
        const dummy = new THREE.Object3D()
        const matrix = new THREE.Matrix4()
        const instance = this.gridMesh!.children[0] as THREE.InstancedMesh
        instance.getMatrixAt(id, matrix)
        dummy.applyMatrix4(matrix)
        instance.localToWorld(dummy.position)
        return dummy.position.clone()
    }
    CheckPoint(id: number) {
        return this.getPosition(id)
    }
    async onLoad(key: string) {
        const mapData = await loadDataTextureAndGeometry(key)
        if (!mapData) return
        mapData.entries.forEach(entry => {
            switch(entry.type) {
                case MapEntryType.CustomGround: {
                    const data = entry.data as CustomGroundData
                    const textureData = new Uint8Array(data.textureData);
                    const texture = new THREE.DataTexture(textureData, data.textureWidth, data.textureHeight, THREE.RGBAFormat);
                    texture.needsUpdate = true;

                    // Restore PlaneGeometry
                    const geometry = new THREE.PlaneGeometry(128, 128, 128, 128);
                    const vertices = geometry.attributes.position.array as Float32Array;

                    for (let i = 0; i < vertices.length; i++) {
                        vertices[i] = data.verticesData[i];
                    }
                    geometry.attributes.position.needsUpdate = true;
                    if (this.customGround) this.scene.remove(this.customGround.obj)
                    this.customGround = new CustomGround({ 
                        width: data.textureWidth, 
                        height: data.textureHeight, 
                        planeSize: data.mapSize, 
                    })
                    this.customGround.LoadMap(texture, geometry)
                    this.eventCtrl.SendEventMessage(EventTypes.SetNonGlow, this.customGround.obj)
                    this.scene.add(this.customGround.obj)
                    break;
                }
                case MapEntryType.Tree: {
                    const treeParam: TreeParam[] = []
                    const treeData = entry.data as TreeData[]
                    treeData.forEach((t) => {
                        treeParam.push({
                            position: new THREE.Vector3(t.position.x, t.position.y, t.position.z),
                            rotation: new THREE.Euler(t.rotation.x, t.rotation.y, t.rotation.z),
                            scale: t.scale,
                            type: t.type,
                            color: t.color
                        })
                    })
                    this.tree.LoadTree(treeParam)
                    break;
                }
                case MapEntryType.Grass: {
                    const grassParam: GrassParam[] = []
                    const grassData = entry.data as GrassData[]
                    grassData.forEach((t) => {
                        grassParam.push({
                            position: new THREE.Vector3(t.position.x, t.position.y, t.position.z),
                            rotation: new THREE.Euler(t.rotation.x, t.rotation.y, t.rotation.z),
                            scale: t.scale,
                            color: new THREE.Color(t.color)
                        })
                    })
                    this.grass.LoadGrass(grassParam)
                    break;
                }
            }
            
        });
    }
    makeMapEntries() {
        const mapData: MapEntry[] = []
        const trees = this.tree.treeParam
        const grasses = this.grass.grassParam
        const treeData: TreeData[] = []
        trees.forEach((t) => {
            if (!t.position || !t.rotation || t.type == undefined || t.scale == undefined || !t.color) throw new Error("undefined data");
            treeData.push({
                position: { x: t.position.x, y: t.position.y, z: t.position.z },
                rotation: { x: t.rotation.x, y: t.rotation.y, z: t.rotation.z },
                scale: t.scale,
                color: t.color,
                type: t.type,
            })
        })
        if (treeData.length > 0) mapData.push({ type: MapEntryType.Tree, data: treeData })

        const grassData: GrassData[] = []
        grasses.forEach((t) => {
            if (!t.position || !t.rotation || t.scale == undefined || !t.color) throw new Error("undefined data");
            grassData.push({
                position: { x: t.position.x, y: t.position.y, z: t.position.z },
                rotation: { x: t.rotation.x, y: t.rotation.y, z: t.rotation.z },
                scale: t.scale,
                color: t.color.getHex(),
            })
        })
        if (grassData.length > 0) mapData.push({ type: MapEntryType.Grass, data: grassData })

        if (this.customGround) {
            const geometry = this.customGround.geometry
            const map = this.customGround.blendMap
            const textureData = Array.from(new Uint8Array(map.image.data.buffer)); // Uint8Array to number array
            const verticesData = Array.from(geometry.attributes.position.array); // Vertex data
            const gData: CustomGroundData = {
                textureData: textureData,
                textureWidth: map.image.width,
                textureHeight: map.image.height,
                verticesData: verticesData,
                mapSize: this.customGround.planSize,
            }
            mapData.push({ type: MapEntryType.CustomGround, data: gData })
        }
        return mapData
    }
    onSave() {
        const key = "mapData_" + this.generateDateKey()
        const mp: MapPackage = {
            key: key, entries: this.makeMapEntries(), date: Date.now()
        } 
        saveDataTextureAndGeometry(key, mp)
    }
    onDown() {
        const key = "mapData_" + this.generateDateKey()
        const mp: MapPackage = {
            key: key, entries: this.makeMapEntries(), date: Date.now()
        }
        downDataTextureAndGeometry(mp)
    }
    generateDateKey(date: Date = new Date()): string {
        const yy = date.getFullYear().toString().slice(-2); // 연도 (YY)
        const mm = String(date.getMonth() + 1).padStart(2, "0"); // 월 (MM)
        const dd = String(date.getDate()).padStart(2, "0"); // 일 (DD)
        const hh = String(date.getHours()).padStart(2, "0"); // 시 (HH)
        const mi = String(date.getMinutes()).padStart(2, "0"); // 분 (MM)

        return `${yy}${mm}${dd}_${hh}${mi}`; // "220201_1233" 형식
    }
}
