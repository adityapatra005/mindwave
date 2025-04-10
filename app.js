class BinauralBeatsGenerator {
    constructor() {
        this.audioContext = null;
        this.oscillatorLeft = null;
        this.oscillatorRight = null;
        this.gainNode = null;
        this.analyser = null;
        this.isPlaying = false;
        this.setupUI();
        this.setupVisualization();
    }

    setupUI() {
        this.baseFreqSlider = document.getElementById('baseFreq');
        this.beatFreqSlider = document.getElementById('beatFreq');
        this.volumeSlider = document.getElementById('volume');
        this.baseFreqValue = document.getElementById('baseFreqValue');
        this.beatFreqValue = document.getElementById('beatFreqValue');
        this.volumeValue = document.getElementById('volumeValue');
        this.playButton = document.getElementById('playButton');
        this.currentState = document.getElementById('currentState');

        this.baseFreqSlider.addEventListener('input', () => this.updateFrequencies());
        this.beatFreqSlider.addEventListener('input', () => this.updateFrequencies());
        this.volumeSlider.addEventListener('input', () => this.updateVolume());
        this.playButton.addEventListener('click', () => this.togglePlay());

        // Setup preset buttons
        document.querySelectorAll('.preset-buttons button').forEach(button => {
            button.addEventListener('click', () => this.setPreset(button.dataset.preset));
        });
    }

    setupVisualization() {
        const canvas = document.getElementById('visualizer');
        this.canvasCtx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    updateVolume() {
        const volumePercent = parseInt(this.volumeSlider.value);
        this.volumeValue.textContent = `${volumePercent}%`;
        
        if (this.gainNode) {
            // Convert percentage to a value between 0 and 1, with a max of 0.5 for safety
            const volumeValue = Math.min((volumePercent / 100) * 0.5, 0.5);
            this.gainNode.gain.setValueAtTime(volumeValue, this.audioContext.currentTime);
        }
    }

    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = (parseInt(this.volumeSlider.value) / 100) * 0.5; // Set initial volume

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        // Create and connect oscillators
        this.oscillatorLeft = this.audioContext.createOscillator();
        this.oscillatorRight = this.audioContext.createOscillator();
        
        const merger = this.audioContext.createChannelMerger(2);
        
        this.oscillatorLeft.connect(merger, 0, 0);
        this.oscillatorRight.connect(merger, 0, 1);
        
        merger.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.updateFrequencies();
    }

    updateFrequencies() {
        const baseFreq = parseFloat(this.baseFreqSlider.value);
        const beatFreq = parseFloat(this.beatFreqSlider.value);
        
        this.baseFreqValue.textContent = `${baseFreq} Hz`;
        this.beatFreqValue.textContent = `${beatFreq} Hz`;

        if (this.oscillatorLeft && this.oscillatorRight) {
            this.oscillatorLeft.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
            this.oscillatorRight.frequency.setValueAtTime(baseFreq + beatFreq, this.audioContext.currentTime);
        }

        this.updateStateInfo(beatFreq);
    }

    updateStateInfo(beatFreq) {
        let state = '';
        if (beatFreq <= 4) state = 'Delta waves (1-4 Hz) - Deep sleep, healing';
        else if (beatFreq <= 7) state = 'Theta waves (4-7 Hz) - Meditation, deep relaxation';
        else if (beatFreq <= 12) state = 'Alpha waves (8-12 Hz) - Relaxed focus, stress reduction';
        else if (beatFreq <= 30) state = 'Beta waves (13-30 Hz) - Active thinking, focus';
        else state = 'Gamma waves (30-100 Hz) - Higher mental activity, perception';
        
        this.currentState.textContent = state;
    }

    setPreset(preset) {
        switch(preset) {
            case 'delta':
                this.beatFreqSlider.value = '2';
                break;
            case 'theta':
                this.beatFreqSlider.value = '6';
                break;
            case 'alpha':
                this.beatFreqSlider.value = '10';
                break;
            case 'beta':
                this.beatFreqSlider.value = '20';
                break;
            case 'gamma':
                this.beatFreqSlider.value = '35';
                break;
        }
        this.updateFrequencies();
    }

    async togglePlay() {
        if (!this.isPlaying) {
            if (!this.audioContext) {
                await this.initAudio();
                this.oscillatorLeft.start();
                this.oscillatorRight.start();
            } else {
                await this.audioContext.resume();
            }
            this.isPlaying = true;
            this.playButton.textContent = 'Stop';
            this.startVisualization();
        } else {
            await this.audioContext.suspend();
            this.isPlaying = false;
            this.playButton.textContent = 'Start';
            this.stopVisualization();
        }
    }

    startVisualization() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.isPlaying) return;
            
            requestAnimationFrame(draw);
            this.analyser.getByteTimeDomainData(dataArray);
            
            const canvas = this.canvasCtx.canvas;
            this.canvasCtx.fillStyle = 'rgba(26, 26, 26, 0.2)';
            this.canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            this.canvasCtx.lineWidth = 2;
            this.canvasCtx.strokeStyle = 'rgb(0, 255, 204)';
            this.canvasCtx.beginPath();
            
            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    this.canvasCtx.moveTo(x, y);
                } else {
                    this.canvasCtx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            this.canvasCtx.lineTo(canvas.width, canvas.height / 2);
            this.canvasCtx.stroke();
        };
        
        draw();
    }

    stopVisualization() {
        const canvas = this.canvasCtx.canvas;
        this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BinauralBeatsGenerator();
});
