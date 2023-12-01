'use strict'

/* 更新日の取得 */
const last = new Date(document.lastModified);
const year = last.getFullYear();
const month = last.getMonth() + 1;
const date = last.getDate();
/* 日付を書き換える */
const target = document.getElementById('modify');
target.textContent = year + '-' + month + '-' + date;
/* ルール */
const dt = document.querySelector("dt");
dt.addEventListener("click", () => {
  dt.parentNode.classList.toggle("appear");
})

// 13,15は除外
const GRAPH = [
    [1, 2, 8, 11, 7, 12],
    [0, 12, 2],
    [0, 1, 3, 9, 8],
    [2, 14, 4, 9],
    [3, 14, 5, 6, 10, 9],
    [4, 14, 6],
    [4, 5, 7, 11, 10],
    [0, 11, 6, 12],
    [0, 2, 9, 10, 11],
    [2, 3, 4, 10, 8],
    [4, 6, 11, 8, 9],
    [0, 8, 10, 6, 7]
];

class State {
    constructor(pieces=null, enemy_pieces=null, vertices=null){
        this.pieces = (vertices) ? pieces : [2, 4, 6, 8, 10, 12];
        this.enemy_pieces = (vertices) ? enemy_pieces : [1, 3, 5, 7, 9, 11];
        this.vertices = (vertices) ? vertices : [null, null, null, null, null, null, null, null, null, null, null, null];
    }
    legal_actions() {
        let actions = [];
        this.pieces.forEach(p => {
            this.vertices.forEach(function(v, i) {
                if (v == null) {
                    actions.push([p, i]);
                }
            });
        });
        return actions;
    }
    next(action){
        let pieces = this.pieces.concat();
        let vertices = this.vertices.concat();
        const index = pieces.indexOf(action[0]);
        pieces.splice(index, 1);
        vertices[action[1]] = action[0];
        return new State(this.enemy_pieces, pieces, vertices);
    }
    is_done(){
        return this.pieces.length == 0;
    }
    minmax(){
        let marks = [null, null, null, null, null, null, null, null, null, null, null, null, 12, 13, 14, 15];
        for (let i = 1; i < 13; i++){
            const v = this.vertices.indexOf(i);
            marks[v] = 0;
            const l = GRAPH[v].length;
            for (let j_ = 0; j_ < l; j_++) {
                const j = GRAPH[v][j_];
                if ((marks[j] == 12 && marks[v] ==14) || (marks[j] == 14 && marks[v] == 12)) {
                    return i;
                }
                else if (marks[j] == 12 || marks[j] == 14) {
                    const t = marks[j];
                    marks[v] = t;
                    let stk = [v];
                    while (stk.length > 0) {
                        const x = stk.pop();
                        GRAPH[x].forEach(k => {
                            if (marks[k] == 0) {
                                marks[k] = t;
                                stk.push(k);
                            }
                        });
                    }
                }
            }
        }
    }
    even_win() {
        return this.minmax()%2 == 0;
    }
}

function random_action(state) {
    const actions = state.legal_actions();
    const rand = Math.floor(Math.random()*actions.length);
    return actions[rand];
}

function playout(state) {
    while (true) {
        if (state.is_done()) {
            return (state.even_win()) ? 1 : 0;
        }
        const action = random_action(state);
        state = state.next(action);
    }
}

function argmax(lst) {
    let index = 0;
    let value = -Infinity;
    for (let i = 0, l = lst.length; i < l; i++){
        if (value < lst[i]) {
            value = lst[i];
            index = i;
        }
    }
    return index;
}

function argmin(lst) {
    let index = 0;
    let value = Infinity;
    for (let i = 0, l = lst.length; i < l; i++){
        if (value > lst[i]) {
            value = lst[i];
            index = i;
        }
    }
    return index;
}

function mcts_action(state) {
    class node {
        constructor(state) {
            this.state = state;
            this.w = 0;
            this.n = 0;
            this.child_nodes = [];
        }
        evaluate() {
            if (this.state.is_done()) {
                const value = (this.state.even_win()) ? 1 : 0;
                this.w += value;
                this.n += 1;
                return value;
            }
            else if (this.child_nodes.length == 0) {
                const value = playout(this.state);
                this.w += value;
                this.n += 1;
                this.state.legal_actions().forEach(action => {
                    const n = new node(this.state.next(action));
                    this.child_nodes.push(n);
                });
                return value;
            }
            else {
                const value = this.next_child_node().evaluate();
                this.w += value;
                this.n += 1;
                return value;
            }
        }
        next_child_node() {
            let ucb_values = [];
            let t = 1;
            this.child_nodes.forEach(child_node => {
                t += child_node.n;
            })
            const even = (this.state.pieces[0]%2 == 0) ? 1: -1;
            this.child_nodes.forEach(child_node => {
                let v = 0;
                if (child_node.n > 0) {
                    v = child_node.w/child_node.n + even*Math.sqrt(2*Math.log(t)/(child_node.n));
                }
                else {
                    v = even*100;
                }
                ucb_values.push(v);
            });
            if (even == 1) {
                return this.child_nodes[argmax(ucb_values)];
            }
            else {
                return this.child_nodes[argmin(ucb_values)];
            }  
        }
    }
    const root_node = new node(state);
    for (let i = 0; i < evaluateCount; i++) {
        root_node.evaluate();
    }
    let max = -Infinity;
    let index = null;
    root_node.child_nodes.forEach(function(child_node, i) {
        if (child_node.n > max) {
            max = child_node.n;
            index = i;
        }
    });
    return state.legal_actions()[index];
}

function place_piece(action) {
    const num = document.getElementById(`n${action[0]}`);
    num.style.color = "#000000";
    num.style.background = "#ffffff";
    const v = document.getElementById(`v${action[1]}`);
    v.textContent = `${action[0]}`;
    v.style.background = (action[0] % 2 == 0) ? "#ED1A3D" : "#31A9EE";
    v.style.cursor = "auto";
}

function addClickIvent(){
    document.getElementById("reset").addEventListener('click', () => {
        document.getElementById("fin").style.display = "none";
        const v = document.getElementById(`v${minmax}`);
        v.style.borderColor = "#000000";
        v.style.borderInlineWidth = "2px";
        if (a0 != null) {
            document.getElementById(`n${a0}`).classList.remove("scale");
        }
        for (let i = 0; i < 12; i++) {
            const v = document.getElementById(`v${i}`);
            v.textContent = "";
            v.style.background = "#ffffff";
        }
        for (let i = 1; i < 13; i++) {
            const num = document.getElementById(`n${i}`);
            num.style.color = "#ffffff";
            num.style.background = (i%2 == 0) ? "#ED1A3D" : "#31A9EE";
        }
        state = new State();
        playerFlag = false;
        resetFlag = true;
        a0 = null;
    })
    document.getElementById("play").addEventListener('click', () => {
        if (resetFlag) {
            resetFlag = false;
            const teban_lst = document.Teban.teban;
            for (let i = 0; i < teban_lst.length; i++) {
                if (teban_lst[i].checked) {
                    teban = teban_lst[i].value;
                    break;
                }
            }
            const level_lst = document.Level.level;
            for (let i = 0; i < level_lst.length; i++) {
                if (level_lst[i].checked) {
                    level = level_lst[i].value;
                    break;
                }
            }
            if (level == 1) {
                evaluateCount = 80;
            }
            else if (level == 2) {
                evaluateCount = 1000;
            }
            else {
                evaluateCount = 30000;
            }
            for (let i = 0; i < 12; i++) {
                document.getElementById(`v${i}`).style.cursor = "pointer";
            }
            if (teban == 0) {
                state.pieces.forEach(p => {
                    document.getElementById(`n${p}`).style.cursor = "pointer";
                });
                playerFlag = true;
            } 
            else {
                state.enemy_pieces.forEach(p => {
                    document.getElementById(`n${p}`).style.cursor = "pointer";
                });
                cpu();
            }
        }
    })
    for (let i = 1; i < 13; i++) {
        const num = document.getElementById(`n${i}`);
        num.addEventListener('click', () => {
            if (playerFlag && state.pieces.includes(i)) {
                num.classList.add("scale");
                if (a0 != null && a0 != i) {
                    document.getElementById(`n${a0}`).classList.remove("scale");
                }
                a0 = i;
            }
        })
    }
    for (let i = 0; i < 12; i++) {
        document.getElementById(`v${i}`).addEventListener('click', () => {
            if (playerFlag && a0 != null && state.vertices[i] == null) {
                const action = [a0, i];
                place_piece(action);
                document.getElementById(`n${action[0]}`).style.cursor = "auto";
                document.getElementById(`n${action[0]}`).classList.remove("scale");
                state = state.next(action);
                a0 = null;
                playerFlag = false;
                (state.is_done()) ? fin() : cpu();
            }
        })
    }
    document.getElementById("close_btn").addEventListener('click', () => {
        document.getElementById("fin").style.display = "none";
    })
}

function cpu() {
    let action;
    if (level == 1 && state.pieces.length == 6){
        action = random_action(state);
        console.log("rand");
    }
    else {
        action = mcts_action(state);
    }
    place_piece(action);
    state = state.next(action);
    (state.is_done()) ? fin() : playerFlag = true;
}

function fin() {
    document.getElementById("fin").style.display = "block";
    document.getElementById("winner").textContent = (state.minmax()%2 == teban) ? "YOU WIN!" : "CPU WIN";
    minmax = state.vertices.indexOf(state.minmax());
    const v = document.getElementById(`v${minmax}`);
    v.style.borderColor = "yellow";
    v.style.borderInlineWidth = "6px";
}

let teban, level;
let state = new State();
let playerFlag = false;
let resetFlag = true;
let a0 = null;
let minmax = 0;
let evaluateCount = 1000;

addClickIvent();

const startTime = Date.now(); // 開始時間
const endTime = Date.now(); // 終了時間
console.log("time =", endTime - startTime);
