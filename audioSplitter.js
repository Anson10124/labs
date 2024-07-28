document.getElementById('audioFile').addEventListener('change', handleFileSelect, false);
document.getElementById('playButton').addEventListener('click', playAudio, false);

let audioContext;
let audioBuffer;
let source;
let splitter;
let merger;
let leftFilter;
let rightFilter;
let gainNode;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            initAudioContext(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    }
}

function initAudioContext(arrayBuffer) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    audioContext.decodeAudioData(arrayBuffer, function(buffer) {
        audioBuffer = buffer;
        document.getElementById('playButton').disabled = false;
    }, function(e) {
        console.error('Error decoding audio data: ' + e.err);
    });
}

function playAudio() {
    if (audioContext && audioBuffer) {
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        splitter = audioContext.createChannelSplitter(2);
        merger = audioContext.createChannelMerger(2);

        leftFilter = audioContext.createBiquadFilter();
        leftFilter.type = 'lowpass';
        leftFilter.frequency.setValueAtTime(400, audioContext.currentTime);

        rightFilter = audioContext.createBiquadFilter();
        rightFilter.type = 'highpass';
        rightFilter.frequency.setValueAtTime(400, audioContext.currentTime);

        gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        source.connect(splitter);

        splitter.connect(leftFilter, 0);
        splitter.connect(rightFilter, 1);

        leftFilter.connect(merger, 0, 0);
        rightFilter.connect(merger, 0, 1);
        
        merger.connect(audioContext.destination);

        source.start(0);
    }
}
