import { spawn } from "child_process";

// Example: run your compiled C++ executable
function runCppProgram(inputData) {
  return new Promise((resolve, reject) => {
    const cppProcess = spawn("./grid.exe"); // your compiled C++ binary

    let output = "";
    cppProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    cppProcess.stderr.on("data", (err) => {
      console.error("C++ error:", err.toString());
    });

    cppProcess.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Process exited with code ${code}`));
    });

    // Send input to C++ program
    cppProcess.stdin.write(inputData + "\n");
    cppProcess.stdin.end();
  });
}

// // Example usage:
// const polygonInput = `3
// 0 0
// 3 4
// 4 0
// 2`; // number of points + points + altitude

// runCppProgram(polygonInput)
//   .then((output) => console.log("C++ Output:\n", output))
//   .catch(console.error);

export default runCppProgram;