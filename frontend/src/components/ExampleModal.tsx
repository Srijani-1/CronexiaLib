import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';

interface ExampleModalProps {
  trigger?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ExampleModal({ trigger, title, description, children }: ExampleModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Open Modal</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
