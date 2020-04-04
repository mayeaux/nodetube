function secondsToFormattedTime(durationInSeconds){
    // Formatted time is in hh:mm:ss format with no leading zeroes.
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor(durationInSeconds % 3600 / 60);
    const seconds = Math.floor(durationInSeconds % 3600 % 60);

    const formattedTime = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // https://stackoverflow.com/questions/42879023/remove-leading-zeros-from-time-format
    const removeLeadingZeroesRegex = /^0(?:0:0?)?/;
    return formattedTime.replace(removeLeadingZeroesRegex, '');
}

module.exports = {
  secondsToFormattedTime
};