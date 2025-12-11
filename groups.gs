const groupA = [''];
const groupB = [''];
//'Linman Shen'

function getGroup(name) { // 「exports.」を削除し、標準の関数定義に変更
  if (groupA.includes(name)) {
    return 'A';
  } else if (groupB.includes(name)) {
    return 'B';
  } else {
    return null;
  }
}
