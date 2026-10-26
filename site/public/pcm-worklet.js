class PontoPCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = 4096;
    this.buffer = new Float32Array(this.size);
    this.offset = 0;
  }
  process(inputs) {
    const samples=inputs[0]?.[0];
    if (!samples) return true;
    for (let i=0;i<samples.length;i++) {
      this.buffer[this.offset++] = samples[i];
      if (this.offset === this.size) {
        this.port.postMessage(this.buffer, [this.buffer.buffer]);
        this.buffer = new Float32Array(this.size);
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('ponto-pcm', PontoPCMProcessor);
