document.addEventListener('DOMContentLoaded', async () => {
    const responseContent = document.getElementById('chatHistory'); // Updated to match EJS
    const textarea = document.getElementById('autoResizeTextarea');
    const button = document.getElementById('snd');

    // Load previous chats
    async function loadPreviousChats() {
        try {
            const response = await fetch('/chats');
            const data = await response.json();

            if (data && data.chats) {
                const reversedChats = data.chats.reverse(); // Reverse the chats to show the latest on top

                reversedChats.forEach(chat => {
                    const chatBlock = createChatBlock(chat._id, chat.question, chat.response, chat.timestamp);
                    responseContent.prepend(chatBlock);
                });

                // Ensure the response container is visible
                document.querySelector('.response-container').style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching previous chats:', error);
        }
    }

    // Create a chat block (user input + server response)
    function createChatBlock(chatId, question, response, timestamp) {
        const chatBlock = document.createElement('div');
        chatBlock.style.marginBottom = '15px';
        chatBlock.setAttribute('data-chat-id', chatId); // Set the chat ID as a data attribute

        const userPromptDiv = createUserPromptDiv(question, timestamp, chatId);
        const serverResponseDiv = createServerResponseDiv(response);

        chatBlock.appendChild(userPromptDiv);
        chatBlock.appendChild(serverResponseDiv);

        return chatBlock;
    }

    // Create the user prompt div
    function createUserPromptDiv(question, timestamp, chatId) {
        const userPromptDiv = document.createElement('div');
        userPromptDiv.classList.add('user-prompt');
        userPromptDiv.style.display = 'flex';
        userPromptDiv.style.justifyContent = 'space-between';
        userPromptDiv.style.alignItems = 'center';
        userPromptDiv.style.gap = '10px';
        userPromptDiv.style.padding = '10px';
        userPromptDiv.style.border = '1px solid #ddd';
        userPromptDiv.style.borderRadius = '5px';
        userPromptDiv.style.backgroundColor = '#f9f9f9';

        // Question container
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.textContent = `User Input: ${question}`;
        questionDiv.style.flex = '1';
        questionDiv.style.wordBreak = 'break-word';

        // Timestamp container
        const timestampDiv = document.createElement('div');
        timestampDiv.classList.add('timestamp');
        const formattedTime = new Date(timestamp).toLocaleString();
        timestampDiv.textContent = formattedTime;
        timestampDiv.style.fontSize = '0.8rem';
        timestampDiv.style.color = '#888';
        timestampDiv.style.whiteSpace = 'nowrap';

        // Button container with dialog
        const buttonDiv = document.createElement('div');
        // Create the button
const actionButton = document.createElement('button');
actionButton.textContent = 'Actions'; // Add button text

// Apply initial styles
actionButton.style.padding = '5px 10px';
actionButton.style.border = 'none';
actionButton.style.borderRadius = '3px';
actionButton.style.cursor = 'pointer';
actionButton.style.filter = 'drop-shadow(5px 5px 1px #343432)'; // Drop-shadow filter
actionButton.style.backgroundColor = '#6C63FF'; // Button background
actionButton.style.color = '#fff'; // Text color
actionButton.style.fontSize = '14px'; // Font size
actionButton.style.transition = 'transform 0.3s ease'; // Smooth hover effect

// Add hover effect with scaling
actionButton.addEventListener('mouseenter', () => {
    actionButton.style.transform = 'scale(1.1)'; // Scale up on hover
});

actionButton.addEventListener('mouseleave', () => {
    actionButton.style.transform = 'scale(1)'; // Reset scale on hover out
});

// Append the button to the body
document.body.appendChild(actionButton);

        const dialogBox = createDialogBox(chatId);
        buttonDiv.appendChild(actionButton);
        buttonDiv.appendChild(dialogBox);

        actionButton.addEventListener('click', () => {
            dialogBox.style.display = dialogBox.style.display === 'none' ? 'block' : 'none';
        });

        // Close the dialog box when clicking outside
        document.addEventListener('click', (e) => {
            if (!buttonDiv.contains(e.target)) {
                dialogBox.style.display = 'none';
            }
        });

        // Append children
        userPromptDiv.appendChild(questionDiv);
        userPromptDiv.appendChild(timestampDiv);
        userPromptDiv.appendChild(buttonDiv);

        return userPromptDiv;
    }

    // Create the server response div
    function createServerResponseDiv(response) {
        const serverResponseDiv = document.createElement('div');
        serverResponseDiv.classList.add('server-response');
        serverResponseDiv.style.marginTop = '5px';
        serverResponseDiv.style.padding = '10px';
        serverResponseDiv.style.border = '1px solid #ddd';
        serverResponseDiv.style.borderRadius = '5px';
        serverResponseDiv.style.backgroundColor = '#fff';
        serverResponseDiv.textContent = `Server Response: ${response}`;
        return serverResponseDiv;
    }

    // Create a dialog box with options
    function createDialogBox(chatId) {
        const dialogBox = document.createElement('div');
        dialogBox.style.position = 'absolute';
        dialogBox.style.background = '#6C63FF';
        dialogBox.style.border = '1px solid #ddd';
        dialogBox.style.borderRadius = '5px';
        dialogBox.style.padding = '10px';
        dialogBox.style.boxShadow = '0px 4px 6px rgba(0,0,0,0.1)';
        dialogBox.style.display = 'none';
        dialogBox.style.zIndex = '100';

        const deleteOption = document.createElement('button');
        deleteOption.textContent = 'Delete';
        deleteOption.style.display = 'block';
        deleteOption.style.marginBottom = '5px';

        const deleteAllOption = document.createElement('button');///////
        deleteAllOption.textContent = 'Delete All';
        deleteAllOption.style.display = 'block';

        // Delete specific chat
        deleteOption.addEventListener('click', async () => {
            try {
                const response = await fetch(`/chat/${chatId}`, { method: 'DELETE' });
                if (response.ok) {
                    document.querySelector(`[data-chat-id="${chatId}"]`).remove();
                    alert('Chat deleted successfully!');
                } else {
                    alert('Failed to delete chat. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting chat:', error);
                alert('An error occurred while deleting the chat.');
            }
        });

        // Delete all chats
        deleteAllOption.addEventListener('click', async () => {
            try {
                const response = await fetch('/chats', { method: 'DELETE' });
                if (response.ok) {
                    responseContent.innerHTML = ''; // Clear chat history
                    alert('All chats deleted successfully!');
                } else {
                    alert('Failed to delete chats. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting chats:', error);
                alert('An error occurred while deleting chats.');
            }
        });

        dialogBox.appendChild(deleteOption);
        dialogBox.appendChild(deleteAllOption);

        return dialogBox;
    }

    // Load chats on page load
    await loadPreviousChats();

    // Handle form submission
    document.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();

        button.disabled = true;
        textarea.placeholder = 'Scraper is working on your response...';

        const prompt = textarea.value;
        textarea.value = '';

        const userPromptDiv = createUserPromptDiv(prompt, new Date().toISOString());
        const serverResponseDiv = createServerResponseDiv('Fetching response...');
        const chatBlock = document.createElement('div');
        chatBlock.appendChild(userPromptDiv);
        chatBlock.appendChild(serverResponseDiv);

        responseContent.prepend(chatBlock);

        try {
            const response = await fetch('/prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ prompt }).toString()
            });
            const result = await response.json();
            serverResponseDiv.textContent = `Server Response: ${result.response}`;
        } catch (error) {
            serverResponseDiv.textContent = 'Error: Unable to fetch response from the server.';
        }

        button.disabled = false;
        textarea.placeholder = 'Scraper.ai';
    });

    // Auto-resize textarea
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = `${this.scrollHeight}px`;
    });
});
