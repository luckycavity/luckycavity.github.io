/*
        
        FILL IN THESE VARIABLES BASED ON THE GUIDE AT https://drawbox.nekoweb.org
        
        IF YOU HAVE ANY QUESTION, SUGGESTIONS, OR NEED HELP, PLEASE EMAIL ME AT drawbox@jhorn.net OR @MONKEYBATION on DISCORD
        
				      /`·.¸
				     /¸...¸`:·
				 ¸.·´  ¸   `·.¸.·´)
				: © ):´;      ¸  {
				 `·.¸ `·  ¸.·´\`·¸)
				     `\\´´\¸.·´
        
*/
const GOOGLE_FORM_ID = "1FAIpQLSc7gk7Ot8_wF9SchGaDx5xf_Pc5v-XU0d4s3hNw7BBeK8ZSuw"; 
const IMAGE_ENTRY_ID = "entry.1369949347";
const NAME_ENTRY_ID = "entry.15412514";      
const WEBSITE_ENTRY_ID = "entry.306295053";  // Replace with new name field entry ID
const GOOGLE_SHEET_ID = "11w2LvZuljHliPFVvejbYIbyd_mXpcWefKuzUa8cVbnI";
const DISPLAY_IMAGES = true;

/*
        
        DONT EDIT BELOW THIS POINT IF YOU DONT KNOW WHAT YOU ARE DOING.
        
*/










const CLIENT_ID = "b4fb95e0edc434c";
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/" + GOOGLE_SHEET_ID + "/export?format=csv";
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/" + GOOGLE_FORM_ID + "/formResponse";

let canvas = document.getElementById("drawboxcanvas");
let context = canvas.getContext("2d");
context.fillStyle = "white";
context.fillRect(0, 0, canvas.width, canvas.height);

let restore_array = [];
let start_index = -1;
let stroke_color = "black";
let stroke_width = "2";
let is_drawing = false;

function change_color(element) {
  stroke_color = element.style.background;
}

function start(event) {
  is_drawing = true;
  context.beginPath();
  context.moveTo(getX(event), getY(event));
  event.preventDefault();
}




function draw(event) {
  if (!is_drawing) return;
  context.lineTo(getX(event), getY(event));
  
  // Handle eraser vs drawing (this needs to come first)
  if (is_erasing) {
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "rgba(0,0,0,1)"; // For eraser, color doesn't matter but we need something
  } else {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = stroke_color;
  }
  
  context.lineWidth = stroke_width;
  
  // Handle brush shape
  if (brush_shape === "round") {
    context.lineCap = "round";
    context.lineJoin = "round";
  } else {
    context.lineCap = "square";
    context.lineJoin = "miter";
  }
  
  context.stroke();
  event.preventDefault();
}





function stop(event) {
  if (!is_drawing) return;
  context.stroke();
  context.closePath();
  is_drawing = false;
  
  // Reset composite operation to normal after drawing
  context.globalCompositeOperation = "source-over";
  
  restore_array.push(context.getImageData(0, 0, canvas.width, canvas.height));
  start_index++;
  event.preventDefault();
}





function getX(event) {
  const rect = canvas.getBoundingClientRect();
  if (event.clientX !== undefined) {
    // Mouse event
    return event.clientX - rect.left;
  } else {
    // Touch event - use clientX instead of pageX
    return event.targetTouches[0].clientX - rect.left;
  }
}

function getY(event) {
  const rect = canvas.getBoundingClientRect();
  if (event.clientY !== undefined) {
    // Mouse event
    return event.clientY - rect.top;
  } else {
    // Touch event - use clientY instead of pageY
    return event.targetTouches[0].clientY - rect.top;
  }
}

canvas.addEventListener("touchstart", start, false);
canvas.addEventListener("touchmove", draw, false);
canvas.addEventListener("touchend", stop, false);
canvas.addEventListener("mousedown", start, false);
canvas.addEventListener("mousemove", draw, false);
canvas.addEventListener("mouseup", stop, false);
canvas.addEventListener("mouseout", stop, false);

function Restore() {
  if (start_index <= 0) {
    Clear();
  } else {
    start_index--;
    restore_array.pop();
    context.putImageData(restore_array[start_index], 0, 0);
  }
}

function Clear() {
  context.fillStyle = "white";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillRect(0, 0, canvas.width, canvas.height);
  restore_array = [];
  start_index = -1;
}

context.drawImage = function() {
	console.warn("noo >:(");
};

document.getElementById("submit").addEventListener("click", async function () {
  const submitButton = document.getElementById("submit");
  const statusText = document.getElementById("status");
  
  // Get the form values
  const artistName = document.getElementById("artist-name").value.trim();
  const artistWebsite = document.getElementById("artist-website").value.trim();
  const spamCheck = document.getElementById("spam-check").value.trim();
  
  // Check if required fields are filled
  if (!artistName) {
    alert("Please enter your name!");
    return;
  }
  
  if (spamCheck.toLowerCase() !== "guestbook") {
    alert("Please enter 'guestbook' in the spam blocker field!");
    return;
  }

  submitButton.disabled = true;
  statusText.textContent = "Uploading...";

  const imageData = canvas.toDataURL("image/png");
  const blob = await (await fetch(imageData)).blob();
  const formData = new FormData();
  formData.append("image", blob, "drawing.png");

  try {
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: `Client-ID ${CLIENT_ID}` },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error("Imgur upload failed");

    const imageUrl = data.data.link;
    console.log("Uploaded image URL:", imageUrl);

    // Create the submission data with name and website
    let submissionData = imageUrl;
    if (artistName) {
      submissionData += " | " + artistName;
    }
    if (artistWebsite) {
      submissionData += " | " + artistWebsite;
    }

    const googleFormData = new FormData();
    googleFormData.append(IMAGE_ENTRY_ID, imageUrl);
    googleFormData.append(NAME_ENTRY_ID, artistName);
    if (artistWebsite) {
      googleFormData.append(WEBSITE_ENTRY_ID, artistWebsite);
    }

    await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      body: googleFormData,
      mode: "no-cors",
    });

    statusText.textContent = "Upload successful!";
    alert("Image uploaded and submitted successfully ☻");
    location.reload();
  } catch (error) {
    console.error(error);
    statusText.textContent = "Error uploading image.";
    alert("Error uploading image or submitting to Google Form.");
  } finally {
    submitButton.disabled = false;
  }
});

async function fetchImages() {
  if (!DISPLAY_IMAGES) {
    console.log("Image display is disabled.");
    return;
  }

  try {
    console.log("Fetching from URL:", GOOGLE_SHEET_URL);
    const response = await fetch(GOOGLE_SHEET_URL);
    console.log("Response status:", response.status);
    
    const csvText = await response.text();
    console.log("CSV data received:", csvText);
    
    const rows = csvText.split("\n").slice(1);
    console.log("Rows after splitting:", rows);

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    
    if (rows.length === 0 || (rows.length === 1 && rows[0].trim() === "")) {
      console.log("No data rows found");
      gallery.innerHTML = "No images submitted yet.";
      return;
    }
    
    rows.reverse().forEach((row, index) => {
      console.log(`Processing row ${index}:`, row);
      
      const columns = row.split(",");
      console.log("Columns:", columns);
      
      if (columns.length < 2) {
        console.log("Skipping row - not enough columns");
        return;
      }

      const rawTimestamp = columns[0].trim();
		// Format timestamp from "8/26/2025 23:37:57" to "2025.08.26"
		const date = new Date(rawTimestamp);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const timestamp = `${year}.${month}.${day}`;


		
      const imgUrl = columns[1].trim().replace(/"/g, "");
      const artistName = columns[2] ? columns[2].trim().replace(/"/g, "") : "Anonymous";
      const artistWebsite = columns[3] ? columns[3].trim().replace(/"/g, "") : "";
      
      if (imgUrl.startsWith("http")) {
        const div = document.createElement("div");
        div.classList.add("image-container");

        // Format the artist line with optional website
        let artistLine = artistName;
        if (artistWebsite && artistWebsite.startsWith("http")) {
          artistLine += ` ▪ <a href="${artistWebsite}" target="_blank">website</a>`;
        }

        div.innerHTML = `
                    <img src="${imgUrl}" alt="drawing by ${artistName}">
                    <p class="artist-line">${artistLine}</p>
                    <p class="timestamp">${timestamp}</p>
                `;
        gallery.appendChild(div);
        console.log("Added image to gallery");
      }

		
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    document.getElementById("gallery").textContent = "Failed to load images.";
  }
}

fetchImages();


// Brush shape functionality
let brush_shape = "round";

function setBrushShape(shape) {
    brush_shape = shape;
    // Update button styles to show which is active
    document.getElementById("round-brush").style.backgroundColor = shape === "round" ? "#ddd" : "";
    document.getElementById("square-brush").style.backgroundColor = shape === "square" ? "#ddd" : "";
}

// Eraser functionality
let is_erasing = false;

function setDrawMode() {
    is_erasing = false;
    
    // Update button styles
    document.getElementById("draw-btn").classList.add("active-tool");
    document.getElementById("erase-btn").classList.remove("active-tool");
    
    // Update cursor
    canvas.style.cursor = "crosshair";
}

function setEraseMode() {
    is_erasing = true;
    
    // Update button styles
    document.getElementById("draw-btn").classList.remove("active-tool");
    document.getElementById("erase-btn").classList.add("active-tool");
    
    // Update cursor
    canvas.style.cursor = "grab";
}

// Initialize draw mode on page load
document.addEventListener("DOMContentLoaded", function() {
    setDrawMode(); // Start in draw mode
});












