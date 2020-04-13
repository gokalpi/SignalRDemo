using Microsoft.AspNetCore.Hosting;

[assembly: HostingStartup(typeof(SignalRDemo.Areas.Identity.IdentityHostingStartup))]

namespace SignalRDemo.Areas.Identity
{
    public class IdentityHostingStartup : IHostingStartup
    {
        public void Configure(IWebHostBuilder builder)
        {
            builder.ConfigureServices((context, services) =>
            {
            });
        }
    }
}