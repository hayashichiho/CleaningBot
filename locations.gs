// locations.js
const cleaningLocations = [
  '201',
  '203',
  '204',
  '205',
  'corridor',
  'sink',
];

exports.getLocations = () => {
  const date = new Date();
  const month = date.getMonth() + 1;

  if (month % 2 === 0) { // 偶数月の場合
    return cleaningLocations;
  } else { // 奇数月の場合
    return cleaningLocations.filter(location => location !== 'corridor' && location !== 'sink');
  }
};
