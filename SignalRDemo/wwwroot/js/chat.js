"use strict";

// Focus on user input
$("#user").focus();

// Create SignalR connection
var connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

// On reconnecting to the hub
connection.onreconnecting((error) => {
    console.assert(connection.state === signalR.HubConnectionState.Reconnecting);

    // Disable all inputs
    toggleAllInputs(true);

    // Clear all recipients
    $("#recipient").empty();

    updateStatus(`Connection lost due to error "${error}". Reconnecting.`);
});

// On reconnected to the hub
connection.onreconnected((connectionId) => {
    console.assert(connection.state === signalR.HubConnectionState.Connected);

    // Client rejoins to the group
    if ($("#group").val()) {
        $("#joinButton").click();
    }

    // Enable all inputs
    toggleAllInputs(false);

    updateStatus(`Connection reestablished. Connected with connectionId "${connectionId}".`);
});

connection.onclose((error) => {
    console.assert(connection.state === signalR.HubConnectionState.Disconnected);

    // Disable all inputs
    toggleAllInputs(true);

    updateStatus(`Connection closed due to error "${error}". Try connecting.`);
});

// Message received function
connection.on("ReceiveMessage", function (sender, message) {
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var encodedMsg = sender + " says " + msg;

    $("#messagesList").append(`<li>${encodedMsg}</li>`);
    $("#messagesLastUpdate").text(moment().format('Do MMMM YYYY, hh:mm:ss'));
});

// When user connected to the hub
connection.on("UserConnected", function (user, connectionId) {
    // Add client from recipients list
    $("#recipient").append(`<option value="${connectionId}">${user}</option>`);

    updateStatus(`User "${user}" connected`);
});

// When user disconnected from the hub
connection.on("UserDisconnected", function (user, connectionId) {
    // Remove client from recipients list
    $("#recipient option[value='" + connectionId + "']").remove();

    updateStatus(`User "${user}" disconnected`);
    //var recipients = $("#recipient");
    //for (var i = 0; i < recipients.length; i++) {
    //    if (recipients.options[i].val() === connectionId) {
    //        recipients.remove(i);
    //    }
    //}
});

// When user joined to a group
connection.on("JoinedGroup", function (user, group) {
    updateStatus(`User "${user}" joined to group ${group}`);
});

// When user leaves a group
connection.on("LeftGroup", function (user, group) {
    updateStatus(`User "${user}" left group ${group}`);
});

$("#user").keyup(function () {
    // Enable/disable connect button
    $("#connectButton").prop("disabled", !$(this).val());
    $("#group").focus();
});

// Click event of Connect button
$("#connectButton").click(function () {
    var user = $("#user");
    if (user.val()) {
        // Start SignalR connection
        connection.start().then(function () {
            // Enable form controls
            $("#disconnectButton").show();
            $("#connectButton").hide();

            toggleAllInputs(false);
        }).catch(err => console.error(err.toString()))

        event.preventDefault();
    }
    else {
        alert("You have to enter a user to connect");
        user.focus();
    }
});

// Click event of Disconnect button
$("#disconnectButton").click(function () {
    if ($("#group").val()) {
        $("#leaveButton").click();
    }

    // Stop SignalR connection
    connection.stop().then(function () {
        // Disable form controls
        $("#connectButton").show();
        $("#disconnectButton").hide();

        toggleAllInputs(true);
    }).catch(err => console.error(err.toString()))

    event.preventDefault();
});

// Click event of Join Group button
$("#joinButton").click(function () {
    var group = $("#group");
    if (group.val()) {
        connection.invoke("JoinGroup", group.val())
            .catch(err => console.error(err.toString()))

        $("#toGroup").prop("disabled", false);

        // Enable form controls
        $("#leaveButton").show();
        $("#joinButton").hide();

        event.preventDefault();
    }
    else {
        alert("You have to enter a group name to join");
        group.focus();
    }
});

// Click event of Leave Group button
$("#leaveButton").click(function (event) {
    var group = $("#group");
    if (group.val()) {
        connection.invoke("LeaveGroup", group.val())
            .catch(err => console.error(err.toString()))

        $("#toGroup").prop("disabled", true);

        // Enable form controls
        $("#joinButton").show();
        $("#leaveButton").hide();

        group.text("");

        event.preventDefault();
    }
    else {
        alert("You have to enter a group name to leave");
        group.focus();
    }
});

$("#toRecipient").click(function () {
    $("#recipient").prop("disabled", false);
});

$("#sendButton").click(function (event) {
    var user = $("#user").val();
    var recipient = $("#recipient option:selected").text();
    var message = $("#message").val();
    var group = $("#group").val();
    var sendTo = $("input[name='sendTo']:checked").val();

    if (sendTo === "All" || sendTo === "Myself") {
        var method = sendTo === "All" ? "SendMessageToAll" : "SendMessageToCaller";
        connection.invoke(method, user, message)
            .catch(err => console.error(err.toString()))
    } else if (sendTo === "Group") {
        if (group) {
            connection.invoke("SendMessageToGroup", user, group, message)
                .catch(err => console.error(err.toString()))
        } else {
            alert("You have to join a group first.");
            group.focus();
        }
    } else {
        connection.invoke("SendMessageToUser", user, recipient, message)
            .catch(err => console.error(err.toString()))
    }

    event.preventDefault();
});

// Updates status list and last update time
function updateStatus(message) {
    $("#statusList").append(`<li>${message}</li>`);
    $("#statusLastUpdate").text(moment().format('Do MMMM YYYY, hh:mm:ss'));
}

// Enable/Disable all inputs
function toggleAllInputs(disabled) {
    $("#disconnectButton").prop("disabled", disabled);
    $("#connectButton").prop("disabled", disabled);
    $("#group").prop("disabled", disabled);
    $("#joinButton").prop("disabled", disabled);
    $("#leaveButton").prop("disabled", disabled);
    $("#toEveryone").prop("disabled", disabled);
    $("#toMyself").prop("disabled", disabled);
    $("#toRecipient").prop("disabled", disabled);
    $("#message").prop("disabled", disabled);
    $("#sendButton").prop("disabled", disabled);
}