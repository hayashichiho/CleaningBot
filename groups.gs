const groupA = ['Yamada Aiki', 'ディエゴ', '田中一輝', '金子慧士', '安藤颯', '白井正真', '村山拳太', '下地　琉生', '長谷川凛人', '山﨑奏'];
const groupB = ['liu shi', '鈴木萌仁伽', '宮沢知穂', '辻美里', '大瀧陽', '根本大雅', 'MOSADDEQUR Kazi', '林知歩', '古俣朝陽', '高橋大司朗'];
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
