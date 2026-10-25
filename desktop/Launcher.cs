// Bird Eye · Parham (Leon) Faraji · leon-executes
using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Reflection;
[assembly: AssemblyTitle("Bird Eye")]
[assembly: AssemblyDescription("Bird Eye desktop launcher")]
[assembly: AssemblyCompany("Parham (Leon) Faraji · leon-executes")]
[assembly: AssemblyProduct("Bird Eye")]
[assembly: AssemblyCopyright("Copyright 2026 Parham (Leon) Faraji")]
[assembly: AssemblyVersion("1.0.2.0")]
static class Launcher {
 [STAThread] static void Main() {
  var root=AppDomain.CurrentDomain.BaseDirectory;
  var exe=Path.Combine(root,"runtime","electron","electron.exe");
  if(!File.Exists(exe)){MessageBox.Show("The desktop runtime is missing. Run Build Windows.cmd or extract the complete release.","Bird Eye",MessageBoxButtons.OK,MessageBoxIcon.Error);return;}
  try {Process.Start(new ProcessStartInfo(exe){WorkingDirectory=root,UseShellExecute=false,CreateNoWindow=true});}
  catch(Exception e){MessageBox.Show(e.Message,"Bird Eye",MessageBoxButtons.OK,MessageBoxIcon.Error);}
 }
}

