import React from 'react'
import DuckImage from '../assets/Duck.jpg'
import './HomeView.css'

export const HomeView = () => (
  <div>
    <h4>Welcome!</h4>
    <img
      alt='This is a duck, because Redux!'
      styleName='duck'
      src={DuckImage} />
  </div>
)

export default HomeView
