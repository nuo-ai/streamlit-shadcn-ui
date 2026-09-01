import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ButtonEnvelope } from "@/protocol/schema"
import type { V2RendererArgs } from "@/app"

type ButtonViewProps = {
  envelope: ButtonEnvelope
  setTriggerValue: V2RendererArgs["setTriggerValue"]
}

export function ButtonControl({
  envelope,
  onClick,
}: {
  envelope: ButtonEnvelope
  onClick: () => void
}) {
  const disabled = envelope.props.disabled || envelope.props.loading
  const content = (
    <>
      {envelope.props.loading && <Spinner />}
      {envelope.props.text}
    </>
  )
  const buttonProps = {
    "aria-busy": envelope.props.loading || undefined,
    className: envelope.props.stretch ? "w-full" : undefined,
    disabled,
    onClick,
    size: envelope.props.size,
    variant: envelope.props.variant,
  } as const

  if (envelope.props.help === null) {
    return <Button {...buttonProps}>{content}</Button>
  }

  return (
    <Tooltip>
      {disabled ? (
        <TooltipTrigger render={<span tabIndex={0} />}>
          <Button {...buttonProps}>{content}</Button>
        </TooltipTrigger>
      ) : (
        <TooltipTrigger render={<Button {...buttonProps} />}>
          {content}
        </TooltipTrigger>
      )}
      <TooltipContent>{envelope.props.help}</TooltipContent>
    </Tooltip>
  )
}

export function ButtonView({
  envelope,
  setTriggerValue,
}: ButtonViewProps) {
  return (
    <div
      className={cn(
        "p-px",
        envelope.props.stretch ? "flex w-full" : "inline-flex"
      )}
      data-ssui-component="button"
      data-testid="ssui-v2-button"
    >
      <ButtonControl
        envelope={envelope}
        onClick={() => {
          setTriggerValue("click", true)
        }}
      />
    </div>
  )
}
