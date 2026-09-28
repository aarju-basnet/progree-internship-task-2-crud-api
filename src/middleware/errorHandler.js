const notFound = (req, res) => res.status(404).json({ error: 'Route not found' });

const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { notFound, errorHandler };
