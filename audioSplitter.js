document.getElementById('audioFile').addEventListener('change', handleFileSelect, false);
document.getElementById('playButton').addEventListener('click', playAudio, false);
document.getElementById('lowpassGain').addEventListener('input', updateLowpassGain, false);
document.getElementById('highpassGain').addEventListener('input', updateHighpassGain, false);

let audioContext;
let audioBuffer;
let source;
let splitter;
let merger;
let lowpassGainNode;
let highpassGainNode;

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

        // Create gain nodes for left (lowpass) and right (highpass) channels
        lowpassGainNode = audioContext.createGain();
        highpassGainNode = audioContext.createGain();

        let lowpassFilter = audioContext.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(400, audioContext.currentTime);

        let highpassFilter = audioContext.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.setValueAtTime(400, audioContext.currentTime);

        source.connect(splitter);

        splitter.connect(lowpassFilter, 0);
        splitter.connect(highpassFilter, 1);

        lowpassFilter.connect(lowpassGainNode);
        highpassFilter.connect(highpassGainNode);

        lowpassGainNode.connect(merger, 0, 0);
        highpassGainNode.connect(merger, 0, 1);
        
        merger.connect(audioContext.destination);

        source.start(0);
    }
}

function updateLowpassGain(event) {
    const gainValue = parseFloat(event.target.value);
    document.getElementById('lowpassValue').textContent = `${gainValue} dB`;

    if (lowpassGainNode) {
        // Ensure gain is within a safe range
        const linearGain = dbToGain(gainValue);
        lowpassGainNode.gain.setValueAtTime(linearGain, audioContext.currentTime);
    }
}

function updateHighpassGain(event) {
    const gainValue = parseFloat(event.target.value);
    document.getElementById('highpassValue').textContent = `${gainValue} dB`;

    if (highpassGainNode) {
        // Ensure gain is within a safe range
        const linearGain = dbToGain(gainValue);
        highpassGainNode.gain.setValueAtTime(linearGain, audioContext.currentTime);
    }
}

// Utility function to convert dB to gain
function dbToGain(db) {
    // Avoid very large values to prevent distortion
    if (db > 30) db = 30;
    if (db < -30) db = -30;
    return Math.pow(10, db / 20);
}
