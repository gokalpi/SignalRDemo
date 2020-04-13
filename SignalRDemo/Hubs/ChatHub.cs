using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace SignalRDemo.Hubs
{
    public class ChatHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("UserConnected", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception ex)
        {
            await Clients.All.SendAsync("UserDisconnected", Context.ConnectionId);
            await base.OnDisconnectedAsync(ex);
        }

        public async Task JoinGroup(string group)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, group);
            await Clients.Group(group).SendAsync("JoinedGroup", Context.ConnectionId, group);
        }

        public async Task LeaveGroup(string group)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
            await Clients.Group(group).SendAsync("LeftGroup", Context.ConnectionId, group);
        }

        public Task SendMessageToAll(string sender, string message)
        {
            return Clients.All.SendAsync("ReceiveMessage", sender, message);
        }

        public Task SendMessageToCaller(string sender, string message)
        {
            return Clients.Caller.SendAsync("ReceiveMessage", sender, message);
        }

        public Task SendMessageToGroup(string sender, string group, string message)
        {
            return Clients.Group(group).SendAsync("ReceiveMessage", sender, message);
        }

        public Task SendMessageToUser(string sender, string recipient, string message)
        {
            return Clients.Client(recipient).SendAsync("ReceiveMessage", sender, message);
        }
    }
}