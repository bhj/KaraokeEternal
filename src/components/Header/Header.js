import React from 'react'
import { Navbar, Nav, NavItem } from 'react-bootstrap'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
// import classes from './Header.scss'
import classes from './Header.css'

export const Header = () => (
  <Navbar className={classes.navBar}>
    <Nav>
      <IndexLinkContainer to='/'>
        <NavItem className={classes.noCollapse}>Home</NavItem>
      </IndexLinkContainer>
      <LinkContainer to='/library'>
        <NavItem className={classes.noCollapse}>Library</NavItem>
      </LinkContainer>
      <LinkContainer to='/player'>
        <NavItem className={classes.noCollapse}>Player</NavItem>
      </LinkContainer>
      <LinkContainer to='/account'>
        <NavItem className={classes.noCollapse}>Account</NavItem>
      </LinkContainer>
    </Nav>
  </Navbar>
)

export default Header
