// Apply the requested simulation credentials once, preserving later password edits.
const credentials = {
  "t1": {
    "passwordSalt": "55475a99-bbe3-4ca8-a369-652e16193f49",
    "passwordHash": "b12a9138fba10f330d2d4211c181dd312d8560e2184e4fc4731f3790cdb519a7"
  },
  "t2": {
    "passwordSalt": "085082b3-5064-4531-9ee9-8c757bcab087",
    "passwordHash": "8bc714cdd4aaea73eef2af45bb3d2da4050c5be56729491d90c9921b0514281d"
  },
  "t3": {
    "passwordSalt": "21b7cd8d-4c74-446b-ba63-e1f5972a9685",
    "passwordHash": "e633d6eed2dd5763e8cf6bd88daacfca576ee76803c4b34d8cbe2b43eb35327b"
  },
  "demo-teacher-kk": {
    "passwordSalt": "836433c5-7413-40d4-be65-45bf6f7fd4da",
    "passwordHash": "50c13f65878023efb2932395babb4ca37e8d470c5337e1e5ae1f48f0d2c58713"
  }
};
export function upgradeDemoTeacherPasswords(db) {
  if (db.demoTeacherPasswordsVersion >= 1) return db;
  return {...db, demoTeacherPasswordsVersion:1, teachers:db.teachers.map(t => credentials[t.id] ? {...t,...credentials[t.id]} : t)};
}
