class PontoPCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const samples = inputs[0]?.[0];
    if (samples && samples.length) this.port.postMessage(new Float32Array(samples));
    return true;
  }
}
registerProcessor('ponto-pcm', PontoPCMProcessor);
