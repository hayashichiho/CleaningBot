// groups.js
const groupA = ['王慧涛', 'Yoshito MIKADO', '服部瑞生', 'ディエゴ', '田中一輝', '金子慧士', '安藤颯', 'Yamada Aiki', '林知歩', '白井正真'];
const groupB = ['LIZhe', '森下裕咲子', '鈴木萌仁伽', '宮沢知穂', '大瀧陽', '根本大雅', '辻美里', '村山拳太', '古俣朝陽'];
//'Linman Shen'

exports.getGroup = (name) => {
  if (groupA.includes(name)) {
    return 'A';
  } else if (groupB.includes(name)) {
    return 'B';
  } else {
    return null;
  }
};
