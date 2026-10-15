export function ContentSkeleton({ cards = false }: { cards?: boolean }) {
  return (
    <div role='status' aria-label='Зареждане на съдържанието' aria-busy='true'>
      <div
        className={cards ? 'zn-grid' : 'zn-skeleton-lines'}
        aria-hidden='true'
      >
        {Array.from({ length: cards ? 3 : 4 }, (_, index) => (
          <div
            key={index}
            className={cards ? 'zn-card zn-skeleton-card' : 'zn-skeleton'}
          >
            {cards && (
              <>
                <div className='zn-card-cover zn-skeleton' />
                <div className='zn-card-body zn-skeleton-lines'>
                  <div className='zn-skeleton' />
                  <div className='zn-skeleton' />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
