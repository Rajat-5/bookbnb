import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function RegisterPage () {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    async function registerUser(event){
        try{
            event.preventDefault();
            await axios.post('/register', {
                name, 
                email, 
                password,
            });
            alert('Account created, please login');
        } catch (e){
            alert("Registration failed, please try again later");
        }
        
    }

    return (
        <div className="mt-4 grow flex items-center justify-around">
            <div className="mb-64">
                <h1 className="text-4xl text-center mb-4">Sign up</h1>
                <form className="max-w-md mx-auto" onSubmit={registerUser}>
                    <input type="text" placeholder="John wills" 
                            value={name} 
                            onChange={ev => setName(ev.target.value)} />
                    <input type="email" placeholder="exampe@email.com" 
                            value={email} 
                            onChange={ev => setEmail(ev.target.value)}/>
                    <input type="password" placeholder="password" 
                            value={password} 
                            onChange={ev => setPassword(ev.target.value)}/>
                    <button className="primary">Sign up</button>
                    <div className="text-center text-gray-500 py-2">
                        Already have an account? <Link className='underline text-black' to={'/login'}>Log in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}