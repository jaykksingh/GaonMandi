const workPackage = process.argv[2];

if (!workPackage) {
  throw new Error("Provide the work package that will implement this command.");
}

console.log(`not yet: ${workPackage}`);
