import React, { useState, useEffect } from 'react';
import ChatComponent from './WebSocket';
import logo from './logo.svg';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8081', {
    reconnection: true,
    reconnectionAttempts: 1,
    reconnectionDelay: 500,
  });

  // Listen for successful connection
  socket.on('connect', () => {
    console.log('Socket connected');
  }); 
  // Listen for connection errors
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

function App() {
  
  const [chatMessages, setChatMessages] = useState([]);
  const [uniqueId, setUniqueId] = useState('playfoxgames');  
  const options = {};

  const [bCount, setBCount] = useState(0);
  const [gCount, setGCount] = useState(0);
  const [result1Width, setResult1Width] = useState('50%');
  const [result2Width, setResult2Width] = useState('50%');
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [timer, setTimer] = useState(10);


  //start connection and connect to the user
  const handleConnect = () => {
    if (uniqueId) {
      if (!socket.connected) {
        startTimer();
        socket.connect(); // Reconnect if not already connected
        socket.emit('setUniqueId', uniqueId, options, (response) => {
          if (response && response.error) {
            console.error('Socket emit error:', response.error);
          } else {
            console.log('Socket emit success');
          }
        });
        console.log("running");
      }
      let el = document.getElementById("remove_from_view");
      el.style.display = "none";
    }
  };
  
  //Timer functionality
  useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => {
        if (timer > 0) {
          setTimer(timer - 1);
        } else {
  
          // Check if the timer is '0'
          if (timer === 0) {
            let el = document.getElementById('winner');
            let winner = document.getElementById('winner_title');
            let winner_points = document.getElementById('winner_points');
            let loser_title = document.getElementById('loser_title');
            //Find Winner
            if(bCount > gCount){
              el.style.backgroundColor = "#7253CA";
              winner.innerText = "Boys Win!";
              winner_points.innerText = bCount;
              loser_title.innerText = `Girls: ${gCount}`;
            }
            else if (bCount < gCount){
              el.style.backgroundColor = "#EC5A5A"
              winner.innerText = "Girls Win!"
              winner_points.innerText = gCount;
              loser_title.innerText = `Boys: ${bCount}`;
            }
            else{
              el.style.backgroundColor = "#367754";
              winner.innerText = "Its a TIE!";
              winner_points.innerText = "";
              loser_title.innerText = "";
            }
            el.style.display = "flex";
          }
  
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isTimerRunning]);
  //change points
  useEffect(() => {
    // This effect will run whenever bCount is changed
    const total = bCount + gCount + 1;
    setResult1Width(`${((bCount + 1) / total) * 100}%`);
    setResult2Width(`${((gCount +1) / total) * 100}%`);
  }, [bCount, gCount]);


  let diamondsCount = 0;
  function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

//Catch events if Boy or Girl add points to BCount and GCount
  useEffect(() => {
    //Catch messages On Chat
    socket.on('chat', (chatData) => {
        if (chatData.comment === 'Boy') {
          console.log('Boy comment'); 
          addB(1);
        }
        if (chatData.comment =='Girl') { 
          console.log('Girl comment'); 
          addG(1);
        }
         console.log('Received chat message:', chatData.comment);
  
        setChatMessages((prevChatMessages) => [...prevChatMessages, chatData.comment]);
    });
    //Catch messages On Gift
    socket.on('gift', (data) => {
        if (!isPendingStreak(data) && data.diamondCount > 0) {
          diamondsCount += (data.diamondCount * data.repeatCount);
        }
        // console.log(data);
        if(data.giftName == "Rose"){
          runG(data);
        }
        if(data.giftName == "TikTok"){
          runB(data);
        }
  }) 
    socket.on('setUniqueId', (data) => {
      // console.log('Received setUniqueId event:', data);
    });
    // Clean up event listeners when the component unmounts 
    return () => {
      socket.disconnect();
    };
  }, []);
  function startTimer() {
    setIsTimerRunning(true);
  }

  //Add BCount
  function addB(amount) {
    setBCount((prevBCount) => {
      const newBCount = prevBCount + amount;
      const total = newBCount + gCount + amount;
      setResult1Width(`${((newBCount + 1) / total) * 100}%`);
      setResult2Width(`${((gCount) / total) * 100}%`);
      return newBCount;
    });
  }
  //Add GCount
  function addG(amount) {
    setGCount((prevGCount) => {
      const newGCount = prevGCount + amount;
      const total = bCount + newGCount + amount;
      setResult1Width(`${(bCount / total) * 100}%`);
      setResult2Width(`${(newGCount / total) * 100}%`);
      return newGCount;
    });
  }
  //OnInteraction run animation and add points
  function runB(data) {
    // Create a new div element
    let newDiv = document.createElement('div');
    
    // Add a class or style to the new div if needed
    newDiv.classList.add('interaction_1');
    newDiv.classList.add('boy-animation');
  
    // Create an image element for the first image
    let img1 = document.createElement('img');
    img1.src = `${data.profilePictureUrl}`;
    img1.alt = 'Your Image';
    img1.id = 'boyPfp';
  
    // Create an image element for the second image
    let img2 = document.createElement('img');
    img2.src = '/images/tiktok.png';
    img2.alt = 'Your Image';
  
    // Create an h1 element
    let h1 = document.createElement('h1');
    h1.textContent = `${data.repeatCount * 5}`;
  
    // Append the elements inside the new div
    newDiv.appendChild(img1);
    newDiv.appendChild(img2);
    newDiv.appendChild(h1);
    
    // Append the new div inside the 'boyContainer' element
    let interactionContainer = document.getElementById('boyContainer');
    interactionContainer.appendChild(newDiv);
    
    // Set a timer to remove the newDiv after two seconds (2000 milliseconds)
    setTimeout(() => {
        newDiv.remove(); // Remove the newDiv from the DOM
        addB(1 * 5);
    }, 2000);
}
//OnInteraction run animation and add points
  function runG(data) {
    // Create a new div element
    let newDiv = document.createElement('div');
    
    // Add a class or style to the new div if needed
    newDiv.classList.add('interaction_2');
    newDiv.classList.add('girl-animation');
  
    // Create an image element for the first image
    let img1 = document.createElement('img');
    img1.src = `${data.profilePictureUrl}`;
    img1.alt = 'Your Image';
    img1.id = 'girlPfp';
  
    // Create an image element for the second image
    let img2 = document.createElement('img');
    img2.src = '/images/rose.png';
    img2.alt = 'Your Image';
  
    // Create an h1 element
    let h1 = document.createElement('h1');
    h1.textContent = `${data.repeatCount * 5}`;
  
    // Append the elements inside the new div
    newDiv.appendChild(img1);
    newDiv.appendChild(img2);
    newDiv.appendChild(h1);
    
    // Append the new div inside the 'boyContainer' element
    let interactionContainer = document.getElementById('girlContainer');
    interactionContainer.appendChild(newDiv);
    
    // Set a timer to remove the newDiv after two seconds (2000 milliseconds)
    setTimeout(() => {
        newDiv.remove(); // Remove the newDiv from the DOM
        addG(1 * 5);
    }, 2000);
}
//formation time
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  //start new game
  function newGame(){
    setTimer(600); setBCount(0); setGCount(0);
    setIsTimerRunning(true);
    let el = document.getElementById('winner');
    el.style.display = "none";
  }
  return (
    <>
    <div className='winner' id='winner'>
      <h1>Congrats!🥳</h1>
      <h2 id='winner_title'>Girls Win!</h2>
      <h2 id='winner_points'>Points {gCount}</h2>
      <div className='controls_container'>
      <button className='ctrl_btn' onClick={newGame}>New</button>
        <button className='ctrl_btn'>End</button>
      </div>
      <h2 id='loser_title'>Boys: {bCount}</h2>
    </div>
      {/* <div className="buttons">
        <button onClick={runB}>AddB</button>
        <button onClick={runG}>AddG</button>
      </div> */} 
      <div className="top_container">
        <div className="display_txt_pt">
          <h1>Boys</h1>
          <h3>Points: <span id="b-count">{bCount}</span></h3>
        </div>

        <h2>{formatTime(timer)}</h2>

        <div className="display_txt_pt">
          <h1>Girls</h1>
          <h3>Points: <span id="g-count">{gCount}</span></h3>
        </div>
      </div> 
      <div className="result_container">
        <div className="result_1" style={{ width: result1Width }}>
          <img src="/images/guy.png" alt="Your Image" />
          <div className="interaction-container " id='boyContainer'>
            <div className="interaction_1 hidden">
              <img src="/images/pfp.png" alt="Your Image" />
              <img src="/images/tiktok.png" alt="Your Image" />
              <h1>+1</h1>  
            </div>
          </div>
        </div>
        <div className="result_2" style={{ width: result2Width }}>
          <img src="/images/girl.png" alt="Your Image" />
          <div className="interaction-container2 " id='girlContainer'>
            <div className="interaction_2 hidden">
              <img src="/images/pfp.png" alt="Your Image" id='girlPfp' />
              <img src="/images/rose.png" alt="Your Image" />
              <h1>+1</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="bottom_container">
        <div className="left_con">
          <div className="element">
            <img src="/images/comment.png" alt="Your Image" />
            <h1>Boy +1</h1>
          </div>
          <div className="element">
            <img src="/images/tiktok.png" alt="Your Image" />
            <h1>+5</h1>
          </div>
        </div>

        <button id='remove_from_view' className="btn_start" onClick={handleConnect}>Connect</button>
        {/* <button onClick={startTimer}>timer</button> */}

        {/* <ChatComponent/> */}
        <div className="right_con">
          <div className="element">
            <img src="/images/rose.png" alt="Your Image" />
            <h1>+5</h1>
          </div>
          <div className="element">
            <img src="/images/comment.png" alt="Your Image" /> 
            <h1>Girl +1</h1>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;