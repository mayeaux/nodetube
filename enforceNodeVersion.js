// TODO: check the node version, if it's below 10 then throw this error and stop install
// TODO: (set it up as preinstall script)

const checkNodeVersion = version => {
  //
  const versionRegex = new RegExp(`^${version}\\..*`);

  console.log(process.versions.node);

  const versionCorrect = process.versions.node.match(versionRegex);
  console.log(versionCorrect);

  if(!versionCorrect){
    throw Error(
      `Running on wrong Nodejs version. Please upgrade the node runtime to version ${version}`
    );
  }
};

checkNodeVersion(10);
