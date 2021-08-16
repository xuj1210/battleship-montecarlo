const express = require('express');
const app = express();
const PORT = 8080;

app.use(express.json());

app.listen(PORT, () => console.log(`working at port ${PORT}`));

app.get('/tshirt', (req, res) => {
  res.status(200).send({
    tshirt: '👕',
    size: 'medium'
  })
});

app.post('/tshirt/:id', (req, res) => {
  const id = req.params.id;
  const logo = req.body.logo;
  console.log('id:', id, "logo:", logo);

  if (!logo) {
    res.status(418).send({ message: 'We need a logo!'});
    // return;
  }

  res.status(200).send({ message: `Received ${logo} with id of ${id}` });
})