# `<header-bar>` Component

The `<header-bar>`component provides a top navigation bar for the PortLib application.  
It displays the current user, the app title, and a logout button.

## Properties

| Property | Type   | Default | Description                         |
| -------- | ------ | ------- | ----------------------------------- |
| `user`   | Object | `null`  | The current authenticated user data |

## Events

| Event    | Type               | Description              |
| -------- | ------------------ | ------------------------ |
| `logout` | `CustomEvent<any>` | Fired when user logs out |

## Slots

This component does not use any slots.

## Example

```html
<header-bar .user=${{ username: "admin" }} @logout=${handleLogout}></header-bar>
```

```js
function handleLogout(e) {
    console.log('User logged out', e);
}
```
