const CHUNK_SIZE = 4096;

class EnglishTwinAudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(CHUNK_SIZE);
    this.offset = 0;
    this.sequence = 0;
    this.inputPort = null;
    this.stopped = false;

    this.port.onmessage = event => {
      const message = event.data;
      if (message?.type === 'connect' && message.port) {
        this.inputPort?.close();
        this.inputPort = message.port;
        this.inputPort.start?.();
        return;
      }

      if (message?.type === 'stop') {
        this.flushPartial();
        this.stopped = true;
        this.inputPort?.close();
        this.inputPort = null;
      }
    };
  }

  flushPartial() {
    if (!this.inputPort || this.offset === 0) return;
    const samples = this.buffer.slice(0, this.offset);
    this.inputPort.postMessage(
      { type: 'process', sequence: this.sequence++, samples },
      [samples.buffer],
    );
    this.offset = 0;
  }

  emitFullBuffer() {
    if (!this.inputPort) {
      this.offset = 0;
      return;
    }

    const samples = this.buffer;
    this.buffer = new Float32Array(CHUNK_SIZE);
    this.offset = 0;
    this.inputPort.postMessage(
      { type: 'process', sequence: this.sequence++, samples },
      [samples.buffer],
    );
  }

  process(inputs, outputs) {
    if (this.stopped) return false;

    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (output) output.fill(0);
    if (!input || input.length === 0) return true;

    let sourceOffset = 0;
    while (sourceOffset < input.length) {
      const remaining = CHUNK_SIZE - this.offset;
      const count = Math.min(remaining, input.length - sourceOffset);
      this.buffer.set(input.subarray(sourceOffset, sourceOffset + count), this.offset);
      this.offset += count;
      sourceOffset += count;

      if (this.offset === CHUNK_SIZE) this.emitFullBuffer();
    }

    return true;
  }
}

registerProcessor('english-twin-audio-capture', EnglishTwinAudioCaptureProcessor);
