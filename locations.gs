const cleaningLocations = [
  '201',
  '203',
  '204',
  '205',
  'corridor',
  'sink',
];

function getLocations() { // 「exports.」を削除し、標準の関数定義に変更
  const date = new Date();
  const month = date.getMonth() + 1;

  if (month % 2 === 0) { // 偶数月の場合
    return cleaningLocations;
  } else { // 奇数月の場合
    return cleaningLocations.filter(location => location !== 'corridor' && location !== 'sink');
  }
};
