// 输入文本域
let inputText = document.getElementById('input-text');
// 换行符提示信息
let rnHintSpan = document.getElementById('rn-hint');
// 时间单位提示信息
let timeUnitHintSpan = document.getElementById('time-unit-hint');
// 时间单位重新应用提示信息
let timeUnitReapplyHintSpan = document.getElementById('time-unit-reapply-hint');
// 存储输出的 div 数组
let outputDivArray = [];
// 换行符
let RN = '\r\n';
let timeUnit = 'milli';

function onRNChange(value) {
    switch (value) {
        case 'rn':
            RN = '\r\n';
            break;
        case 'n':
            RN = '\n';
            break;
        default:
    }
    if (outputDivArray.length) {
        rnHintSpan.style.display = 'inline-block';
    }
}

function onTimeUnitChange(value) {
    timeUnit = value;
    if (outputDivArray.length) {
        timeUnitHintSpan.style.display = 'none';
        timeUnitReapplyHintSpan.style.display = 'inline-block';
    }
}

function onClearClick() {
    inputText.value = '';
}

function onGenerateClick() {
    try {
        rnHintSpan.style.display = 'none';
        timeUnitHintSpan.style.display = 'inline-block';
        timeUnitReapplyHintSpan.style.display = 'none';
        // 如果上一次生成的 div 标签存在就移除掉
        let temp;
        while (outputDivArray.length) {
            temp = outputDivArray.pop();
            temp.parentNode.removeChild(temp);
        }
        // 剪映 json 对象
        temp = JSON.parse(inputText.value);
        let srtFiles = convertJSON2SRT(temp);
        let text;
        for (let k in srtFiles) {
            text = srtFiles[k];
            temp = document.createElement('div');
            temp.innerHTML = '<textarea cols="60" rows="15" readonly>' + text + '</textarea>';
            temp.appendChild(document.createElement('br'));
            temp.appendChild(getDownloadLink('jy_' + k + '.srt', text));
            temp.appendChild(document.createElement('br'));
            temp.appendChild(document.createElement('br'));
            document.body.appendChild(temp);
            outputDivArray.push(temp);
        }
    } catch (e) {
        console.log(e);
        alert('JSON 解析错误');
    }
}

function convertJSON2SRT(jy) {
    // 提取文本材料
    // Map 结构 = {id1: text1, id2: text2, ...}
    let texts = {}, temp = jy.materials.texts;
    for (let i in temp) {
        texts[temp[i].id] = temp[i].content;
    }

    // 轨道列表
    let tracks = jy.tracks, track;
    // SRT 文件 Map
    let srtFiles = {};
    for (let i in tracks) {
        track = tracks[i];
        temp = convertTrack2Srt(track, texts);
        if (temp) {
            srtFiles[track.id] = temp;
        }
    }
    return srtFiles;
}

/**
 * 将一条轨道转换为 SRT 文本
 * @param track 轨道
 * @param texts 文本材料
 * @return {string}
 */
function convertTrack2Srt(track, texts) {
    let segments = track.segments, segment;
    let srt = { content: null, start: null, end: null };
    let srtText = '', index = 0;
    for (let i in segments) {
        segment = segments[i];
        srt.content = texts[segment.material_id];
        if (!srt.content) continue;
        srt.start = segment.target_timerange.start;
        srt.end = srt.start + segment.target_timerange.duration;
        srt.start = getSrtTimeText(srt.start);
        srt.end = getSrtTimeText(srt.end);
        index++;
        srtText += formatSrt(index, srt);
    }
    return srtText;
}

/**
 * 获取下载地址的标签
 * @param fileName 文件名
 * @param data 数据
 * @returns {HTMLElement}
 */
function getDownloadLink(fileName, data) {
    // 创建 a 标签
    let a = document.createElement('a');
    a.innerText = '保存到本地';
    a.download = fileName;
    //生成一个 blob 二进制数据，内容为数据
    let blob = new Blob([data], { type: 'application/octet-stream' });
    //生成一个指向 blob 的 URL 地址，并赋值给 a 标签的 href 属性
    a.href = URL.createObjectURL(blob);
    return a;
}

/**
 * 获取 SRT 格式的时间文本
 * @param time 时间，windows版本为微秒数
 * @returns {string}
 */
function getSrtTimeText(time) {
    // 1h1m1s111ms = 61m1s111ms = 3661s111ms = 3661111ms
    if (timeUnit === 'micro') {
        time = Math.floor(time / 1000);
    }
    // 余出的毫秒
    let millisecond = time % 1000;
    time = Math.floor(time / 1000);
    // 余出秒
    let second = time % 60;
    time = Math.floor(time / 60);
    // 余出分钟
    let minute = time % 60;
    time = Math.floor(time / 60);
    // 剩余时数
    let hour = time;
    hour = formatDigit(hour, 2);
    minute = formatDigit(minute, 2);
    second = formatDigit(second, 2);
    millisecond = formatDigit(millisecond, 3);
    return hour + ':' + minute + ':' + second + ',' + millisecond;
}

/**
 * 格式化为 SRT
 * @param index 字幕序号，从 1 开始
 * @param SRT 字幕内容等信息
 * @returns {string}
 */
function formatSrt(index, srt) {
    return index + RN + srt.start + ' --> ' + srt.end + RN + srt.content + RN + RN;
}

/**
 * 格式化数字
 * @param digit 数字
 * @param length 长度
 * @returns {string}
 */
function formatDigit(digit, length) {
    let str = digit.toString();
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}