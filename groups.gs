const groupA = ['白井正真', '村山拳太'];
const groupB = ['林知歩', '古俣朝陽'];

function getGroup(name) { // 「exports.」を削除し、標準の関数定義に変更
  if (groupA.includes(name)) {
    return 'A';
  } else if (groupB.includes(name)) {
    return 'B';
  } else {
    return null;
  }
}
