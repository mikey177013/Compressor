// DOM Elements
const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");
const workspace = document.getElementById("workspace");
const originalImage = document.getElementById("originalImage");
const compressedImage = document.getElementById("compressedImage");
const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const qualityBadge = document.getElementById("qualityBadge");
const maxWidthSlider = document.getElementById("maxWidth");
const widthValue = document.getElementById("widthValue");
const downloadBtn = document.getElementById("downloadBtn");
const compressAgainBtn = document.getElementById("compressAgainBtn");
const originalSizeEl = document.getElementById("originalSize");
const compressedSizeEl = document.getElementById("compressedSize");
const originalDimensions = document.getElementById("originalDimensions");
const savingsEl = document.getElementById("savings");
const loadingOverlay = document.getElementById("loadingOverlay");
const notification = document.getElementById("notification");
const notificationText = document.getElementById("notificationText");
const formatOptions = document.querySelectorAll(".format-option");
const canvas = document.getElementById("particleCanvas");

// Global Variables
let originalDataUrl = null;
let compressedBlob = null;
let originalFileSize = 0;
let originalWidth = 0;
let originalHeight = 0;
let currentFormat = "jpeg";

// Initialize the application
function init() {
  initParticleBackground();
  bindEvents();
  setInitialValues();
}

// Initialize particle background
function initParticleBackground() {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 80;
  
  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 0.5,
      color: `rgba(99, 102, 241, ${Math.random() * 0.4 + 0.1})`,
      angle: Math.random() * Math.PI * 2
    });
  }
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles.forEach(particle => {
      particle.x += Math.cos(particle.angle) * particle.speed;
      particle.y += Math.sin(particle.angle) * particle.speed;
      
      // Wrap around edges
      if (particle.x < -particle.radius) particle.x = canvas.width + particle.radius;
      if (particle.x > canvas.width + particle.radius) particle.x = -particle.radius;
      if (particle.y < -particle.radius) particle.y = canvas.height + particle.radius;
      if (particle.y > canvas.height + particle.radius) particle.y = -particle.radius;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // Draw connections
      particles.forEach(otherParticle => {
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 * (1 - distance/100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.stroke();
        }
      });
    });
  }
  
  animate();
  
  // Resize handler
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Set initial values for sliders and displays
function setInitialValues() {
  qualityValue.textContent = qualitySlider.value;
  qualityBadge.textContent = Math.round(qualitySlider.value * 100) + "%";
  widthValue.textContent = "Original";
}

// Bind all event listeners
function bindEvents() {
  // Upload box events
  uploadBox.addEventListener("click", () => fileInput.click());
  uploadBox.addEventListener("dragover", handleDragOver);
  uploadBox.addEventListener("dragleave", handleDragLeave);
  uploadBox.addEventListener("drop", handleDrop);
  
  // File input event
  fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));
  
  // Control events
  qualitySlider.addEventListener("input", updateQualityValue);
  qualitySlider.addEventListener("change", compressImage);
  maxWidthSlider.addEventListener("input", updateWidthValue);
  maxWidthSlider.addEventListener("change", compressImage);
  
  // Button events
  downloadBtn.addEventListener("click", downloadImage);
  compressAgainBtn.addEventListener("click", resetAndCompressAgain);
  
  // Format options
  formatOptions.forEach(option => {
    option.addEventListener("click", () => {
      formatOptions.forEach(btn => btn.classList.remove("active"));
      option.classList.add("active");
      currentFormat = option.dataset.format;
      compressImage();
    });
  });
}

// Handle drag over event
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadBox.style.borderColor = "var(--primary)";
  uploadBox.style.transform = "translateY(-5px)";
}

// Handle drag leave event
function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadBox.style.borderColor = "rgba(255, 255, 255, 0.1)";
  uploadBox.style.transform = "translateY(0)";
}

// Handle drop event
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  handleDragLeave(e);
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

// Handle file selection
function handleFile(file) {
  if (!file || !file.type.match("image.*")) {
    showNotification("Please select a valid image file", "error");
    return;
  }
  
  // Check file size (limit to 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showNotification("Please select an image smaller than 10MB", "error");
    return;
  }
  
  showLoading(true);
  
  const reader = new FileReader();
  reader.onload = (e) => {
    originalDataUrl = e.target.result;
    originalImage.src = originalDataUrl;
    originalFileSize = file.size;
    originalSizeEl.textContent = formatFileSize(file.size);
    
    // Get image dimensions
    const img = new Image();
    img.onload = function() {
      originalWidth = this.width;
      originalHeight = this.height;
      originalDimensions.textContent = `${originalWidth} x ${originalHeight}`;
      
      // Set max width slider to match image width
      maxWidthSlider.value = originalWidth;
      maxWidthSlider.max = originalWidth;
      updateWidthValue();
      
      workspace.classList.remove("hidden");
      compressImage();
    };
    img.src = originalDataUrl;
  };
  
  reader.onerror = () => {
    showLoading(false);
    showNotification("Error reading file", "error");
  };
  
  reader.readAsDataURL(file);
}

// Update quality value display
function updateQualityValue() {
  const quality = parseFloat(qualitySlider.value);
  qualityValue.textContent = quality;
  qualityBadge.textContent = Math.round(quality * 100) + "%";
}

// Update width value display
function updateWidthValue() {
  const width = parseInt(maxWidthSlider.value);
  if (width === parseInt(maxWidthSlider.max)) {
    widthValue.textContent = "Original";
  } else {
    widthValue.textContent = `${width}px`;
  }
}

// Compress the image
function compressImage() {
  if (!originalDataUrl) return;
  
  showLoading(true);
  
  // Use setTimeout to allow the UI to update before starting compression
  setTimeout(() => {
    const img = new Image();
    img.src = originalDataUrl;
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = img.width;
      let newHeight = img.height;
      const maxWidth = parseInt(maxWidthSlider.value);
      
      if (maxWidth < img.width) {
        newWidth = maxWidth;
        newHeight = (img.height * maxWidth) / img.width;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw image with new dimensions
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Determine mime type based on selected format
      let mimeType = "image/jpeg";
      if (currentFormat === "png") mimeType = "image/png";
      if (currentFormat === "webp") mimeType = "image/webp";
      
      // Quality for different formats
      let quality = parseFloat(qualitySlider.value);
      if (currentFormat === "png") {
        // PNG uses a different compression approach (0-1 but different meaning)
        quality = quality * 0.9; // Adjust for PNG
      }
      
      // Convert to blob with selected format and quality
      canvas.toBlob(
        (blob) => {
          compressedBlob = blob;
          compressedImage.src = URL.createObjectURL(blob);
          compressedSizeEl.textContent = formatFileSize(blob.size);
          
          // Calculate savings
          const savings = 100 - (blob.size / originalFileSize * 100);
          savingsEl.textContent = `${savings.toFixed(1)}% saved`;
          savingsEl.style.color = savings > 0 ? "var(--success)" : "var(--error)";
          
          showLoading(false);
          showNotification("Image compressed successfully!", "success");
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => {
      showLoading(false);
      showNotification("Error loading image", "error");
    };
  }, 100);
}

// Download the compressed image
function downloadImage() {
  if (!compressedBlob) {
    showNotification("No compressed image available", "error");
    return;
  }
  
  const link = document.createElement("a");
  link.download = getDownloadFileName();
  link.href = URL.createObjectURL(compressedBlob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification("Download started!", "success");
}

// Generate download file name
function getDownloadFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `compressed-${timestamp}.${currentFormat}`;
}

// Reset and compress again
function resetAndCompressAgain() {
  fileInput.value = "";
  workspace.classList.add("hidden");
  uploadBox.style.display = "block";
}

// Format file size for display
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + " KB";
  } else {
    return (bytes / 1048576).toFixed(2) + " MB";
  }
}

// Show loading overlay
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove("hidden");
  } else {
    loadingOverlay.classList.add("hidden");
  }
}

// Show notification
function showNotification(message, type) {
  notificationText.textContent = message;
  notification.className = "notification";
  
  // Set background color based on type
  if (type === "success") {
    notification.style.background = "var(--success)";
  } else if (type === "error") {
    notification.style.background = "var(--error)";
  } else {
    notification.style.background = "var(--warning)";
  }
  
  notification.classList.remove("hidden");
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 3000);
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);