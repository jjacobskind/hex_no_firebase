import express from 'express';
const router = express.Router();
import renderReact from '../middleware/renderReact';
import MenuApp from '../../client/app/react/components/MenuApp';

router.get('/', renderReact(MenuApp), (req, res, next) => {
  res.render('reactTemplate.ejs');
})

export default router;
