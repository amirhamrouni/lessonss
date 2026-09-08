class ShadowingRecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];

    if (input?.length) {
      const copy = input.slice();
      this.port.postMessage(copy, [copy.buffer]);
      if (output) output.set(input);
    } else if (output) {
      output.fill(0);
    }

    return true;
  }
}

registerProcessor("shadowing-recorder", ShadowingRecorderProcessor);
