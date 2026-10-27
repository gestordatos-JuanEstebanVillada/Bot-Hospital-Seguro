function requireAuth(req, res, next) {
  if (req.session?.usuarioIntranet) {
    return next();
  }
  return res.redirect('/admin/login');
}

module.exports = { requireAuth };
