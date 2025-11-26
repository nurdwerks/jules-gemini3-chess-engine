function trace(message) {
  if (process.env.TRACE === 'true') {
    console.log(message);
  }
}

module.exports = trace;
