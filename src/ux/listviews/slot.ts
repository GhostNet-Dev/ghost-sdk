import { Icons } from "../menuicons/icontypes"
import { GetIconDb } from "../menuicons/preicons"


export default class Slot {
    icons = GetIconDb()

    dom = document.createElement("div")
    constructor({ width = "80px", height = "80px", icon = Icons.Star } = {}) {
        this.dom.style.width = width
        this.dom.style.height = height
        this.dom.style.borderRadius = "8px"
        this.dom.style.justifyContent = "center"
        this.dom.style.alignItems = "center"
        this.dom.style.transition = "transform 0.2s, box-shadow 0.2s"

        this.dom.style.background = "linear-gradient(145deg, #0b3d91, #1e90ff)"
        this.dom.style.border = "3px solid rgba(135, 206, 250, 0.8)"

        // Icon set
        const iconDom = document.createElement('img') as HTMLImageElement
        iconDom.src = this.icons.get(icon)!
        iconDom.classList.add("h-100")
    }
}

/*
테마	배경색 1 (진한 색)	배경색 2 (밝은 색)	테두리색 (RGBA)
파란색	#0B3D91	#1E90FF	rgba(135, 206, 250, 0.8)
녹색	#006400	#32CD32	rgba(144, 238, 144, 0.8)
빨강	#8B0000	#FF6347	rgba(255, 160, 122, 0.8)
노랑	#B8860B	#FFD700	rgba(255, 239, 134, 0.8)
 */
const css = `

/* 슬롯 기본 스타일 */
.slot {
    width: 80px;
    height: 80px;
    border-radius: 8px; /* 둥근 모서리 */
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.2s, box-shadow 0.2s; /* 호버 효과 */
}

/* 1. 기본 디자인 */
.standard-slot {
    background: linear-gradient(145deg, #0b3d91, #1e90ff); /* 진한 파랑에서 밝은 파랑 */
    border: 2px solid #1c6ea4; /* 파란 테두리 */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5); /* 입체감을 위한 그림자 */
}

/* 2. 입체감 강조 디자인 */
/* 입체감 강조 디자인 슬롯 */
.embossed-slot {
    background: linear-gradient(145deg, #0b3d91, #1e90ff); /* 동일한 배경 */
    border: 2px solid #1c6ea4; /* 기본 테두리 */
    box-shadow: 
        inset 2px 2px 4px rgba(0, 0, 0, 0.8), /* 안쪽 음영 */
        inset -2px -2px 4px rgba(255, 255, 255, 0.3), /* 안쪽 빛 */
        0 4px 8px rgba(0, 0, 0, 0.5); /* 외부 그림자 */
}

/* 3. 밝은 테두리 강조 디자인 */
.bright-border-slot {
    background: linear-gradient(145deg, #0b3d91, #1e90ff); /* 동일한 배경 */
    border: 3px solid rgba(135, 206, 250, 0.8); /* 밝은 파란색 테두리 */
}
`
