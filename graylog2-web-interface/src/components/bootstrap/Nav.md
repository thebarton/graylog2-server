### Default

```js
import { NavItem } from 'components/bootstrap';

<Nav bsStyle="pills" activeKey={1}>
  <NavItem eventKey={1} href="#">
    NavItem 1 content
  </NavItem>
  <NavItem eventKey={2} title="Item">
    NavItem 2 content
  </NavItem>
  <NavItem eventKey={3} disabled>
    NavItem 3 content
  </NavItem>
</Nav>;
```

### Tabs w/ Dropdown

```js
import { NavItem, NavDropdown, MenuItem } from 'components/bootstrap';

<Nav bsStyle="tabs" activeKey="1" onSelect={(k) => this.handleSelect(k)}>
  <NavItem eventKey="1" href="/home">
    NavItem 1 content
  </NavItem>
  <NavItem eventKey="2" title="Item">
    NavItem 2 content
  </NavItem>
  <NavItem eventKey="3" disabled>
    NavItem 3 content
  </NavItem>
  <NavDropdown eventKey="4" title="Dropdown" id="nav-dropdown">
    <MenuItem eventKey="4.1">Action</MenuItem>
    <MenuItem eventKey="4.2">Another action</MenuItem>
    <MenuItem eventKey="4.3">Something else here</MenuItem>
    <MenuItem divider />
    <MenuItem eventKey="4.4">Separated link</MenuItem>
  </NavDropdown>
</Nav>;
```

### Stacked

```js
import { NavItem, NavDropdown, MenuItem } from 'components/bootstrap';

<Nav bsStyle="pills" stacked activeKey={1}>
  <NavItem eventKey={1} href="/home">
    NavItem 1 content
  </NavItem>
  <NavItem eventKey={2} title="Item">
    NavItem 2 content
  </NavItem>
  <NavItem eventKey={3} disabled>
    NavItem 3 content
  </NavItem>
</Nav>;
```

### Justified

```js
import { NavItem } from 'components/bootstrap';

<Nav bsStyle="tabs" justified activeKey={1}>
  <NavItem eventKey={1} href="/home">
    NavItem 1 content
  </NavItem>
  <NavItem eventKey={2} title="Item">
    NavItem 2 content
  </NavItem>
  <NavItem eventKey={3} disabled>
    NavItem 3 content
  </NavItem>
</Nav>;
```
