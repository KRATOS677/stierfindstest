using STIerFinds.MAUI.Views;
using STIerFinds.MAUI.ViewModels;
using STIerFinds.MAUI.Services;
using CommunityToolkit.Mvvm.Messaging;

namespace STIerFinds.MAUI;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});

		// Register Services
		builder.Services.AddSingleton<SupabaseService>();
		builder.Services.AddSingleton<AuthService>();
		builder.Services.AddSingleton<ItemService>();
		builder.Services.AddSingleton<MessagingService>();

		// Register ViewModels
		builder.Services.AddSingleton<WelcomeViewModel>();
		builder.Services.AddSingleton<LoginViewModel>();
		builder.Services.AddSingleton<SignupViewModel>();
		builder.Services.AddSingleton<AdminLoginViewModel>();
		builder.Services.AddSingleton<DashboardViewModel>();
		builder.Services.AddSingleton<AdminDashboardViewModel>();
		builder.Services.AddSingleton<MessagesViewModel>();

		// Register Views
		builder.Services.AddSingleton<WelcomePage>();
		builder.Services.AddSingleton<LoginPage>();
		builder.Services.AddSingleton<SignupPage>();
		builder.Services.AddSingleton<AdminLoginPage>();
		builder.Services.AddSingleton<DashboardPage>();
		builder.Services.AddSingleton<AdminDashboardPage>();
		builder.Services.AddSingleton<MessagesPage>();

		// Register Messenger for communication
		builder.Services.AddSingleton<IMessenger>(WeakReferenceMessenger.Default);

		return builder.Build();
	}
}
