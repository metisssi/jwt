import React, { useContext, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import LoginForm from './components/LoginForm';
import { Context } from '.';
import { observer } from 'mobx-react-lite';
import { IUser } from './models/response/IUser';
import UserService from './services/UserService';

function App() {

  const {store} = useContext(Context)
  const [users, setUsers] = useState<IUser[]>([])

  useEffect(() => {
    if(localStorage.getItem('token')) {
        store.checkAuth()
    }
    }, [])

    async function getUsers() {
      try {
        const response = await UserService.fetchUsers()
        setUsers(response.data)
      }catch(e) {
        console.log(e)
      }
    }

    if(store.isLoading) {
      return <div>Loading...</div>
    }

  if(!store.isAuth) {
    return (
       <div>
          <LoginForm/>
          <button onClick={getUsers}>Get Users</button>
      </div>
      
    )
  }
  return (
    <div>
      <h1>{store.isAuth ? `User authorized ${store.user.email}` : 'Autorize'}</h1>
      <h1>{store.user.isActivated ? `Account confrimed on mail` : `Confrim password`}</h1>
      <button onClick={() => store.logout()}>Logout</button>
      <div>
          <button onClick={getUsers}>Get Users</button>
      </div>
      {users.map(user => 
        <div key={user.email}>{user.email}</div>
      )}
    </div>
  );
}

export default observer(App);
