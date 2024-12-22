import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import IEventController, { ILoop, IViewer } from "@Glibs/interface/ievent";
import { Canvas } from "@Glibs/systems/event/canvas";
import { EventTypes } from "@Glibs/types/globaltypes";
import { IPhysicsObject } from "@Glibs/interface/iobject";

export class Camera extends THREE.PerspectiveCamera implements IViewer, ILoop {
    private controls: OrbitControls

    constructor(
        canvas: Canvas,
        eventCtrl: IEventController,
        player: IPhysicsObject,
    ) {
        super(45, canvas.Width / canvas.Height, 0.1, 400)
        eventCtrl.SendEventMessage(EventTypes.RegisterLoop, this)
        eventCtrl.SendEventMessage(EventTypes.RegisterViewer, this)
        this.controls = new OrbitControls(this, canvas.Canvas)
        this.controls.enabled = false
        this.position.set(7, 5, 7)
        this.lookAt(player.Pos)
    }

    resize(width: number, height: number) {
        this.aspect = width / height
        this.updateProjectionMatrix()
    }

    update() {
        this.controls.update()
    }

    shakeCamera(intensity = 0.5, duration = 0.3) {
        const startTime = performance.now();
        const backup = new THREE.Vector3()
        backup.copy(this.position)

        const updateShake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed > duration * 1000) {
                this.position.copy(backup)
                return;
            }

            const shakeX = (Math.random() - 0.5) * intensity;
            const shakeY = (Math.random() - 0.5) * intensity;

            this.position.x += shakeX;
            this.position.y += shakeY;

            requestAnimationFrame(updateShake);
        }

        updateShake();
    }
}
