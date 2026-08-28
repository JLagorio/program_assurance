import { Avatar, AvatarFallback } from "program-assurance";

export function Assignees() {
  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarFallback>JR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SO</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>KP</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function Named() {
  return (
    <div className="space-y-2" style={{ maxWidth: 320 }}>
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-[13px] font-medium">M. Chen</div>
          <div className="text-[12px] text-muted-foreground">ISSO — GovCloud Payroll</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-[13px] font-medium">Sarah Chen</div>
          <div className="text-[12px] text-muted-foreground">Compliance lead</div>
        </div>
      </div>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar style={{ width: 24, height: 24 }}>
        <AvatarFallback className="text-[10px]">JR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>JR</AvatarFallback>
      </Avatar>
      <Avatar style={{ width: 40, height: 40 }}>
        <AvatarFallback>JR</AvatarFallback>
      </Avatar>
    </div>
  );
}
