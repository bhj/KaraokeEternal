import React from 'react'
import { Navbar, Nav, NavItem } from 'react-bootstrap'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'
import classes from './Header.scss'

export const Header = () => (
  <div>
    <h1>Karaoke Forever</h1>
    <Navbar>
      <Nav>
        <IndexLinkContainer to='/' activeClassName={classes.activeRoute}>
          <NavItem>Home</NavItem>
        </IndexLinkContainer>
        <LinkContainer to='/counter' activeClassName={classes.activeRoute}>
          <NavItem>Counter</NavItem>
        </LinkContainer>
        <LinkContainer to='/player' activeClassName={classes.activeRoute}>
          <NavItem>Player</NavItem>
        </LinkContainer>
        <LinkContainer to='/account' activeClassName={classes.activeRoute}>
          <NavItem>Account</NavItem>
        </LinkContainer>
      </Nav>
    </Navbar>
  </div>
)

export default Header
