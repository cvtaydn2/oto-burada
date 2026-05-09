async function test() {
  try {
    console.log("Testing async iterator over dummy string readable stream");
    const { Readable } = await import("node:stream");
    const s = Readable.from(["hello", " world"]);
    for await (const chunk of s) {
       process.stdout.write(chunk);
    }
    console.log("\nSuccess");
  } catch(e) {
    console.error(e);
  }
}
test();
