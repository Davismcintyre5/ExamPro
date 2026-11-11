require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.db.collection('classes');
  const classes = await col.find({}).toArray();

  let fixed = 0;

  for (const cls of classes) {
    const original = cls.className || '';
    const cleaned = original
      .replace(/â€"/g, '-')
      .replace(/â€"/g, '-')
      .replace(/Â/g, '')
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€™/g, "'");

    if (cleaned !== original) {
      await col.updateOne({ _id: cls._id }, { $set: { className: cleaned } });
      console.log(`"${original}" -> "${cleaned}"`);
      fixed++;
    }
  }

  console.log(`\nFixed: ${fixed} classes`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});