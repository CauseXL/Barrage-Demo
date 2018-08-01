let data = [{
        value: "这是第一条弹幕",
        speed: 2,
        time: 0,
        color: "red",
        fontSize: 20
    },
    {
        value: "这是第二条弹幕",
        time: 1
    }
];

class CanvasBarrage {
    constructor(canvas, video, options = {}) {
        if (!canvas || !video) return;
        this.canvas = canvas;
        this.video = video;

        this.canvas.width = video.clientWidth;
        this.canvas.height = video.clientHeight;

        this.isPaused = true;

        let defaultOptions = {
            fontSize: 20,
            color: "gold",
            speed: 2,
            opacity: 0.3,
            data: [],
        };

        Object.assign(this, defaultOptions, options);

        this.barrages = this.data.map(item => new Barrage(item, this));

        this.context = canvas.getContext('2d');

        this.render();
    }

    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderBarrage();
        if (this.isPaused == false) {
            requestAnimationFrame(this.render.bind(this));
        }
    }

    renderBarrage() {
        let time = this.video.currentTime;
        this.barrages.forEach(barrage => {
            if (!barrage.flag && time >= barrage.time) {
                if (!barrage.isInited) {
                    barrage.init();
                    barrage.isInited = true;
                }

                barrage.x -= barrage.speed;
                barrage.render();

                if (barrage.x < barrage.width * -1) {
                    barrage.flag = true;
                }
            }
        });
    }

    add(item) {
        this.barrages.push(new Barrage(item, this));
    }

    reset() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let time = this.video.currentTime;
        this.barrages.forEach(barrage => {
            barrage.flag = false;
            if (time <= barrage.time) {
                barrage.isInited = false;
            } else {
                barrage.flag = true;
            }
        });
    }
}

class Barrage {
    constructor(item, ctx) {
        this.value = item.value;
        this.time = item.time;
        this.item = item;
        this.ctx = ctx;
    }

    init() {
        this.opacity = this.item.opacity || this.ctx.opacity;
        this.color = this.item.color || this.ctx.color;
        this.fontSize = this.item.fontSize || this.ctx.fontSize;
        this.speed = this.item.speed || this.ctx.speed;

        let span = document.createElement("span");
        span.innerText = this.value;
        span.style.font = this.fontSize + 'px "Microsoft YaHei"';
        span.style.position = "absolute";
        document.body.appendChild(span);
        this.width = span.clientWidth;
        document.body.removeChild(span);

        // 存储弹幕出现的横纵坐标
        this.x = this.ctx.canvas.width;
        this.y = this.ctx.canvas.height;

        // 处理弹幕纵向溢出的边界处理
        if (this.y < this.fontSize) {
            this.y = this.fontSize;
        }
        if (this.y > this.ctx.canvas.height - this.fontSize) {
            this.y = this.ctx.canvas.height - this.fontSize;
        }
    }

    render() {
        this.ctx.context.font = this.fontSize + 'px "Microsoft YaHei"';
        this.ctx.context.fillStyle = this.color;
        this.ctx.context.fillText(this.value, this.x, this.y);
    }
}



let $ = document.querySelector.bind(document);

let canvas = $("#canvas");
let video = $("#video");

// let canvasBarrage = new CanvasBarrage(canvas, video, {
//     data
// });

let canvasBarrage;

let socket = new WebSocket("ws://localhost:3000");

socket.onopen = function() {
    socket.onmessage = function(e) {
        let message = JSON.parse(e.data);

        if (message.type === "INIT") {
            canvasBarrage = new CanvasBarrage(canvas, video, {
                data: message.data
            });
        } else if (message.type === "ADD") {
            canvasBarrage.add(message.data);
        }
    };
};


video.addEventListener('play', () => {
    canvasBarrage.isPaused = false;
    canvasBarrage.render();
})

video.addEventListener('pause', () => {
    canvasBarrage.isPaused = true;
})

video.addEventListener("seeked", function() {
    canvasBarrage.reset();
});

$('#add').addEventListener('click', () => {
    let time = video.currentTime;
    let value = $("#text").value;
    let color = $("#color").value;
    let fontSize = $("#range").value;
    let sendObj = { time, value, color, fontSize };
    socket.send(JSON.stringify(sendObj));
    // canvasBarrage.add(sendObj);
})