import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { getUser } from "../../utilities/users-service";
import ModelViewer from "../../components/Scene/ModelViewer";
import "./App.css";
import AuthPage from "../AuthPage/AuthPage";
import ChatPage from "../Chat/Chat";
import NavBar from "../../components/NavBar/NavBar";

export default function App() {
	const [user, setUser] = useState(getUser());

	return (
		<main className="App">
			{user ? (
				<>
					<NavBar user={user} setUser={setUser} />
					{/* <ModelViewer scale="100" modelPath={"/images/mansion.glb"} /> */}
					<Routes>
						{/* Route components in here */}
						<Route path="/" element={<ChatPage user={user} />} />
					</Routes>
				</>
			) : (
				<AuthPage setUser={setUser} />
			)}
		</main>
	);
}
