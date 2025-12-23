from google.adk.runners import Runner
import inspect

# Check the signature of Runner.run
print("Runner.run signature:")
print(inspect.signature(Runner.run))

# Check what parameters it accepts
print("\nRunner.run parameters:")
for param_name, param in inspect.signature(Runner.run).parameters.items():
    print(f"  {param_name}: {param.annotation if param.annotation != inspect.Parameter.empty else 'no annotation'}")
