let gainNode;
let gainRange;
let audioContext = null;
let sampleRate = 48000;
let worker;
let onnx_path = './denoiser_model.ort'
let optimizationMode = 'original';
console.log("Script loaded, optimization mode:", optimizationMode);

window.addEventListener("load", (event) => {
  document.getElementById("toggle").addEventListener("click", toggleSound);

  gainRange = document.getElementById("gain");  
  gainRange.oninput = () => {
    if (gainNode) {
      gainNode.gain.value = gainRange.value;
    }
  };
  
  gainRange.disabled = true;

  // Handle optimization mode change
  const optimizationSelect = document.getElementById("optimization");
  optimizationSelect.addEventListener("change", async (event) => {
    optimizationMode = event.target.value;
    console.log("Optimization mode changed to:", optimizationMode);
    
    // If audio is currently running, restart it with the new optimization mode
    if (audioContext) {
      console.log("Restarting audio with new optimization mode...");
      // Stop current audio
      gainRange.disabled = true;
      if (worker) {
        worker.postMessage({"command": "stop"});
      }
      await audioContext.close();
      audioContext = null;
      
      // Restart audio with new mode
      setTimeout(() => {
        audioDemoStart();
        gainRange.disabled = false;
      }, 100);
    }
  });
});

async function toggleSound(event) {
  if (!audioContext) {
    audioDemoStart();

    gainRange.disabled = false;
  } else {
    gainRange.disabled = true;
    worker.postMessage({"command": "stop"})

    await audioContext.close();
    audioContext = null;
  }
}

async function setupWorker(rawSab, denoisedSab) {
  // The Web Worker can receive two commands: 
  // - on "init", it starts periodically reading from the queue and
  //  accumulating audio data.
  // - on "stop", it takes all this accumulated audio data, converts to PCM16
  // instead of float32 and turns the stream into a WAV file, sending it back
  // to the main thread to offer it as download.

  URLFromFiles(['worker.js', 'ringbuffer.js']).then((e) => {
      worker = new Worker(e);

      worker.onmessage = (e) => {
        const { type } = e.data;

        switch (type) {
          case "FETCH_WASM": {
            let pkgPath = '/pkg';
            if (optimizationMode === 'optimized') {
              pkgPath = '/pkg_optimized';
            } else if (optimizationMode === 'fast') {
              pkgPath = '/pkg_fast';
            }
            
            console.log("Using WASM package from:", pkgPath);
            
            // Show loading progress
            showLoadingProgress();
            
            let wasmBytes;
            console.log("Starting WASM fetch from:", pkgPath);
            fetch(`${pkgPath}/df_bg.wasm`)
              .then((response) => {
                console.log("WASM response received");
                updateLoadingProgress(25, "Downloading WASM...");
                return response.arrayBuffer();
              })
              .then((bytes) => {
                console.log("WASM bytes received, size:", bytes.byteLength);
                wasmBytes = bytes;
                updateLoadingProgress(50, "WASM downloaded, loading model...");
                return fetch('/DeepFilterNet3_onnx.tar.gz').then((response) => response.arrayBuffer());
              })
              .then((model_bytes) => {
                console.log("Model bytes received, size:", model_bytes.byteLength);
                console.log("WASM bytes available:", wasmBytes ? wasmBytes.byteLength : "undefined");
                updateLoadingProgress(75, "Initializing worker...");
                worker.postMessage({
                  command: "init",
                  bytes: wasmBytes,
                  base_url: document.baseURI,
                  pkg_path: pkgPath,
                  model_bytes: model_bytes,
                  rawSab: rawSab,
                  denoisedSab: denoisedSab
                });
                updateLoadingProgress(100, "Ready!");
                setTimeout(hideLoadingProgress, 500);
              })
              .catch((error) => {
                console.error("Error loading WASM:", error);
                hideLoadingProgress();
              });
            break;
          }
          case "SETUP_AWP": {
            setupWebAudio(rawSab, denoisedSab);
          }
          default: {
            break;
          }
        }
      }
      
      // worker.postMessage({
      //   command: "init", 
        // rawSab: rawSab,
        // denoisedSab: denoisedSab,
      //   sampleRate: sampleRate,
      //   base_url: document.baseURI,
      //   onnx_path: onnx_path,
      //   hop_size: 480,
      //   state_size: 45304
      // });
  });
};

async function setupWebAudio(rawSab, denoisedSab) {
  audioContext.resume();

  gainNode = audioContext.createGain()

  URLFromFiles(['audio-processor.js', 'ringbuffer.js']).then((e) => {
      audioContext.audioWorklet.addModule(e)
        .then(() => getLiveAudio(audioContext))
        .then((liveIn) => {
            // After the resolution of module loading, an AudioWorkletNode can be constructed.
            let audioProcesser = new AudioWorkletNode(audioContext, 'random-audio-processor', 
                {
                  processorOptions: {
                    rawSab: rawSab,
                    denoisedSab: denoisedSab
                  }
                }
            )
            // AudioWorkletNode can be interoperable with other native AudioNodes.
            liveIn.connect(audioProcesser).connect(gainNode).connect(audioContext.destination)
        })
        .catch(e => console.error(e))
  });
}

async function audioDemoStart() {
  audioContext = new AudioContext({sampleRate: sampleRate})

  var rawSab = RingBuffer.getStorageForCapacity(sampleRate * 2, Float32Array);
  var denoisedSab = RingBuffer.getStorageForCapacity(sampleRate * 2, Float32Array);

  setupWorker(rawSab, denoisedSab);
}

function getLiveAudio(audioContext) {
  return navigator.mediaDevices.getUserMedia({
          audio: true
      })
      .then(stream => audioContext.createMediaStreamSource(stream))
}

// Loading progress functions
function showLoadingProgress() {
  document.getElementById('loading-status').style.display = 'block';
  document.getElementById('loading-progress').value = 0;
  document.getElementById('loading-text').textContent = 'Initializing...';
}

function updateLoadingProgress(percent, text) {
  document.getElementById('loading-progress').value = percent;
  document.getElementById('loading-text').textContent = text;
}

function hideLoadingProgress() {
  document.getElementById('loading-status').style.display = 'none';
}